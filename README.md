# TutorConnect

A comprehensive tutoring platform connecting students with expert tutors, featuring AI-powered study assistance, task management, and real-time communication.

## Architecture

This project has been **restructured for Render deployment** with:

- **Backend**: Node.js/Express API with PostgreSQL
- **Frontend**: React SPA with Tailwind CSS  
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: JWT-based auth system
- **Deployment**: Optimized for Render with auto-scaling

## Quick Start

### For Render Deployment

1. **Fork/Clone** this repository
2. **Push to GitHub**
3. **Deploy to Render**:
   - Connect your GitHub repo to Render
   - Use the included `render.yaml` blueprint
   - Render will auto-setup PostgreSQL and deploy both services

4. **Initialize Database**:

   ```bash
   # In Render backend shell
   npm run db:migrate
   ```

📖 **Detailed deployment guide**: [DEPLOYMENT.md](DEPLOYMENT.md)

### For Local Development

```bash
# Install dependencies
npm run setup

# Set environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Run both frontend and backend
npm run dev
```

## Project Structure

```
tutor-connect/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth & validation
│   │   ├── database/       # Schema & migrations
│   │   └── utils/          # Helpers
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API integration
│   │   └── context/        # State management
│   └── package.json
├── render.yaml            # Deployment config
└── DEPLOYMENT.md          # Deployment guide
```

- **Primary**: Blue (#3b82f6, #2563eb, #1d4ed8)
- **Secondary**: Gray shades for neutral elements
- **Status**: Green (success), Yellow (warning), Red (error)

### Components

- **Buttons**: Primary, Secondary with consistent styling
- **Forms**: Accessible input fields with validation
- **Cards**: Clean, shadowed containers for content
- **Navigation**: Responsive sidebar and top navigation

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## ♿ Accessibility Features

- **WCAG Compliant**: Follows Web Content Accessibility Guidelines
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: Meets AA standards for text readability

## 🤖 AI Integration

### Current Features (Phase 2)

- **Q&A Chatbot**: Floating widget with intelligent responses
- **Study Tips**: Contextual learning guidance
- **Platform Help**: Navigation and feature assistance

### Future Features (Planned)

- **Study Plan Generation**: AI-created learning paths
- **Tutor Matching**: Intelligent tutor recommendations
- **Calendar Integration**: Automated scheduling suggestions

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/tutor-connect-group2.git
   cd tutor-connect-group2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Demo Accounts

Try the application with these demo accounts:

**Student Account:**

- Email: `alice@example.com`
- Password: `demo`

**Tutor Account:**

- Email: `bob@example.com`
- Password: `demo`

**Admin Account:**

- Email: `carol@example.com`
- Password: `demo`

## � Deployment

### Live Demo

The application is deployed on GitHub Pages and can be accessed at:
**[https://Abhinaykotla.github.io/Tutor_Connect_Group2](https://Abhinaykotla.github.io/Tutor_Connect_Group2)**

### Deploy to GitHub Pages

This project is configured for easy deployment to GitHub Pages:

1. **Build and Deploy**

   ```bash
   npm run deploy
   ```

   This command will:
   - Build the production version of the app
   - Deploy it to the `gh-pages` branch
   - Make it available on GitHub Pages

2. **Manual Deployment**

   If you need to deploy manually:

   ```bash
   npm run build
   npx gh-pages -d build
   ```

### Deployment Configuration

The deployment is configured in `package.json`:

- **Homepage**: Points to your GitHub Pages URL
- **Predeploy Script**: Automatically builds before deployment
- **Deploy Script**: Uses gh-pages to deploy the build folder

**Note**: The application uses `HashRouter` instead of `BrowserRouter` to ensure proper routing on GitHub Pages. URLs will have a `#` symbol (e.g., `/#/student/dashboard`) which is normal for GitHub Pages deployments.

### Requirements for Deployment

- Repository must be public (for free GitHub Pages)
- GitHub Pages must be enabled in repository settings
- The `gh-pages` package is installed as a dev dependency

## �📊 Mock Data

The application includes comprehensive mock data:

- **Users**: 5 sample users across all roles
- **Tutors**: 2 detailed tutor profiles with ratings and subjects
- **Sessions**: Sample tutoring sessions with feedback
- **Tasks**: Study planner tasks with various statuses
- **Calendar**: Events, deadlines, and reminders
- **Messages**: Chat conversations between users
- **AI Responses**: Contextual chatbot interactions

## Development Roadmap

### Phase 1: Planning & Proposal [COMPLETED]

- Requirements gathering and system design
- Database schema and wireframes
- Technology stack selection

### Phase 2: Frontend Development 🚧 (Current)

- React component development
- Responsive UI implementation
- Mock data integration
- AI chatbot MVP

### Phase 3: Backend Development (Planned)

- API development with Node.js/Express
- Database implementation (PostgreSQL)
- Authentication system (JWT)
- Real-time features (WebSocket)

### Phase 4: Advanced Features (Planned)

- Payment integration (Stripe/PayPal)
- Video calling (WebRTC)
- Advanced AI features
- Mobile application

## 🧪 Testing

### Manual Testing Checklist

- [ ] Authentication flow (login/signup/logout)
- [ ] Role-based navigation and permissions
- [ ] Responsive design across devices
- [ ] AI chatbot interactions
- [ ] Task management CRUD operations
- [ ] Tutor search and filtering
- [ ] Accessibility features

### Future Testing

- Unit tests with Jest and React Testing Library
- Integration tests for API endpoints
- E2E tests with Cypress
- Performance testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: System architecture and coordination
- **Frontend Developer**: React components and UI/UX
- **AI Researcher**: Chatbot integration and intelligent features
- **Backend Developer**: API and database design (Phase 3)

## Support

For questions or support, please:

- Open an issue in this repository
- Contact the development team
- Check the documentation in `/docs` folder

---

**Note**: This is Phase 2 of the project focusing on frontend development with mock data. Backend integration and real-time features will be implemented in subsequent phases.
