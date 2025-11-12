<#
.SYNOPSIS
  One-click Postgres setup for TutorConnect using Scheema.sql + Data.sql

.DESCRIPTION
  This script provisions a PostgreSQL database by applying the provided schema
  (Scheema.sql) and data (Data.sql). It can:
    - Create (and optionally drop) the target database
    - Strip CREATE DATABASE/\connect/meta lines from the schema when targeting a custom DB
    - Ensure required extension: uuid-ossp
    - Ensure required unique constraint: password_reset_tokens(user_id)
    - Load seed data
    - Verify critical bits and print a short summary

.PARAMETER Host
  PostgreSQL host (default: localhost)

.PARAMETER Port
  PostgreSQL port (default: 5432)

.PARAMETER Username
  PostgreSQL username (default: postgres)

.PARAMETER Password
  PostgreSQL password. If omitted, the script will prompt securely.

.PARAMETER DatabaseName
  Target database name to create/apply schema to (default: TutorConnect)

.PARAMETER UseFileDatabaseName
  Honor CREATE DATABASE and \connect statements in Scheema.sql (e.g., TutorConnectTest).
  When set, the script runs Scheema.sql as-is against the 'postgres' DB and doesn't attempt
  to create/drop the DatabaseName parameter.

.PARAMETER DropIfExists
  If set, drops the target database before (re)creating it. Ignored when -UseFileDatabaseName is set.

.PARAMETER SchemaFile
  Path to Scheema.sql (default resolves next to this script)

.PARAMETER DataFile
  Path to Data.sql (default resolves next to this script)

.EXAMPLE
  # Create TutorConnect db from Scheema.sql/Data.sql, dropping any existing db
  ./setup-db.ps1 -Password "admin" -DatabaseName "TutorConnect" -DropIfExists

.EXAMPLE
  # Respect CREATE DATABASE/\\connect inside Scheema.sql (creates TutorConnectTest)
  ./setup-db.ps1 -Password "admin" -UseFileDatabaseName

.NOTES
  Requires psql in PATH. On Windows, ensure PostgreSQL bin is on PATH or specify full psql path in PATH.
#>

[CmdletBinding()] param(
  [string] $Host = "localhost",
  [int]    $Port = 5432,
  [string] $Username = "postgres",
  [string] $Password,
  [string] $DatabaseName = "TutorConnect",
  [switch] $UseFileDatabaseName,
  [switch] $DropIfExists,
  [string] $SchemaFile,
  [string] $DataFile
)

$ErrorActionPreference = 'Stop'

function Write-Section($title) {
  Write-Host "`n== $title ==" -ForegroundColor Cyan
}

function Resolve-PathOrDefault([string]$path, [string]$defaultRelative) {
  if ([string]::IsNullOrWhiteSpace($path)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    return (Join-Path $scriptDir $defaultRelative)
  }
  return (Resolve-Path -LiteralPath $path).Path
}

function Require-File([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "File not found: $path"
  }
}

function Find-Psql() {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($null -eq $cmd) {
    throw "psql not found in PATH. Install PostgreSQL client tools or add psql to PATH."
  }
  return $cmd.Path
}

function Invoke-PsqlFile([string]$db, [string]$file) {
  param()
  $psql = Find-Psql
  & $psql -h $Host -p $Port -U $Username -d $db -v ON_ERROR_STOP=1 -f $file
  if ($LASTEXITCODE -ne 0) { throw "psql failed applying file: $file (exit $LASTEXITCODE)" }
}

function Invoke-PsqlCommand([string]$db, [string]$sql) {
  $psql = Find-Psql
  & $psql -h $Host -p $Port -U $Username -d $db -v ON_ERROR_STOP=1 -c $sql
  if ($LASTEXITCODE -ne 0) { throw "psql failed running command against $db (exit $LASTEXITCODE)" }
}

try {
  # Resolve inputs
  $schemaPath = Resolve-PathOrDefault $SchemaFile 'Scheema.sql'
  $dataPath   = Resolve-PathOrDefault $DataFile   'Data.sql'
  Require-File $schemaPath
  Require-File $dataPath

  if (-not $Password) {
    $Password = Read-Host -AsSecureString "Enter PostgreSQL password"
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
      [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    )
  }

  # Scope password to child psql processes
  $originalPgPwd = $env:PGPASSWORD
  $env:PGPASSWORD = $Password

  Write-Section "Inputs"
  Write-Host "Host           : $Host"
  Write-Host "Port           : $Port"
  Write-Host "Username       : $Username"
  Write-Host "DatabaseName   : $DatabaseName"
  Write-Host "UseFileDBName  : $($UseFileDatabaseName.IsPresent)"
  Write-Host "DropIfExists   : $($DropIfExists.IsPresent)"
  Write-Host "SchemaFile     : $schemaPath"
  Write-Host "DataFile       : $dataPath"

  if ($UseFileDatabaseName) {
    Write-Section "Applying schema as-is (honor CREATE DATABASE/\\connect)"
    Invoke-PsqlFile -db 'postgres' -file $schemaPath

    # We don't know the DB name programmatically without parsing; inform user what's inside.
    Write-Host "Schema applied. If Scheema.sql creates 'TutorConnectTest', data will be loaded into that DB."

    # Try loading data into the created DB name from file header (best-effort parse)
    $fileText = Get-Content -LiteralPath $schemaPath -Raw
    $dbNameMatch = [regex]::Match($fileText, 'CREATE\s+DATABASE\s+"(?<name>[^"]+)"', 'IgnoreCase')
    $targetDb = if ($dbNameMatch.Success) { $dbNameMatch.Groups['name'].Value } else { $null }
    if (-not $targetDb) { throw "Could not determine created database name from Scheema.sql. Re-run without -UseFileDatabaseName and specify -DatabaseName." }

    Write-Section "Ensuring extension/constraint in $targetDb"
    Invoke-PsqlCommand -db $targetDb -sql 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    Invoke-PsqlCommand -db $targetDb -sql @'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_user_id_key'
  ) THEN
    ALTER TABLE public.password_reset_tokens
      ADD CONSTRAINT password_reset_tokens_user_id_key UNIQUE (user_id);
  END IF;
END$$;
'@

    Write-Section "Loading data into $targetDb"
    Invoke-PsqlFile -db $targetDb -file $dataPath

    Write-Section "Verifications for $targetDb"
    Invoke-PsqlCommand -db $targetDb -sql "SELECT extname FROM pg_extension WHERE extname='uuid-ossp';"
    Invoke-PsqlCommand -db $targetDb -sql "SELECT conname FROM pg_constraint WHERE conname='password_reset_tokens_user_id_key';"
    Invoke-PsqlCommand -db $targetDb -sql 'SELECT COUNT(*) AS users_count FROM public.users;'
    Invoke-PsqlCommand -db $targetDb -sql 'SELECT COUNT(*) AS subjects_count FROM public.subjects;'
  }
  else {
    Write-Section "Preparing target database: $DatabaseName"
    if ($DropIfExists) {
      Write-Host "Dropping database if exists..."
      Invoke-PsqlCommand -db 'postgres' -sql "DROP DATABASE IF EXISTS \"$DatabaseName\";"
    }

    Write-Host "Creating database if not exists..."
    Invoke-PsqlCommand -db 'postgres' -sql @"
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$DatabaseName') THEN
    EXECUTE 'CREATE DATABASE "'$DatabaseName'" WITH ENCODING ''UTF8'' TEMPLATE template0';
  END IF;
END$$;
"@

    Write-Section "Applying schema to $DatabaseName (stripping CREATE DATABASE/\\connect)"
    # Create temp copy without meta commands
    $tempSchema = Join-Path ([System.IO.Path]::GetTempPath()) ("Scheema.stripped." + [Guid]::NewGuid().ToString() + ".sql")
    $schemaRaw = Get-Content -LiteralPath $schemaPath
    $filtered = $schemaRaw | Where-Object {
      ($_ -notmatch '^\s*CREATE\s+DATABASE\s') -and \
      ($_ -notmatch '^\s*\\connect\s') -and \
      ($_ -notmatch '^\s*\\restrict\b') -and \
      ($_ -notmatch '^\s*\\unrestrict\b')
    }
    $filtered | Set-Content -LiteralPath $tempSchema -Encoding UTF8
    try {
      Invoke-PsqlFile -db $DatabaseName -file $tempSchema
    }
    finally {
      if (Test-Path -LiteralPath $tempSchema) { Remove-Item -LiteralPath $tempSchema -Force -ErrorAction SilentlyContinue }
    }

    Write-Section "Ensuring extension/constraint in $DatabaseName"
    Invoke-PsqlCommand -db $DatabaseName -sql 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    Invoke-PsqlCommand -db $DatabaseName -sql @'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_user_id_key'
  ) THEN
    ALTER TABLE public.password_reset_tokens
      ADD CONSTRAINT password_reset_tokens_user_id_key UNIQUE (user_id);
  END IF;
END$$;
'@

    Write-Section "Loading data into $DatabaseName"
    Invoke-PsqlFile -db $DatabaseName -file $dataPath

    Write-Section "Verifications for $DatabaseName"
    Invoke-PsqlCommand -db $DatabaseName -sql "SELECT extname FROM pg_extension WHERE extname='uuid-ossp';"
    Invoke-PsqlCommand -db $DatabaseName -sql "SELECT conname FROM pg_constraint WHERE conname='password_reset_tokens_user_id_key';"
    Invoke-PsqlCommand -db $DatabaseName -sql 'SELECT COUNT(*) AS users_count FROM public.users;'
    Invoke-PsqlCommand -db $DatabaseName -sql 'SELECT COUNT(*) AS subjects_count FROM public.subjects;'
  }

  Write-Section "Completed"
  Write-Host "Database setup finished successfully." -ForegroundColor Green
}
catch {
  Write-Error $_
  exit 1
}
finally {
  $env:PGPASSWORD = $originalPgPwd
}
