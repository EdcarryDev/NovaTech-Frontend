# MikroTik Connect

A modern web application for managing MikroTik routers with a focus on Hotspot management and monitoring.

## Features

- 🚀 Real-time router monitoring
- 💻 Hotspot user management
- 📊 Traffic analytics and reporting
- 🎫 Voucher generation and management
- 📱 Responsive dashboard interface
- 🔒 Secure router connections
- 📈 Financial tracking and reporting
- 🌐 Multi-router support

## Tech Stack

- **Frontend:**
  - React.js
  - TypeScript
  - Tailwind CSS
  - Shadcn/ui Components
  - React Query
  - React Router

- **Backend:**
  - Node.js
  - Express
  - PostgreSQL
  - MikroTik API Integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- MikroTik router with API access enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mikrotik-connect.git
cd mikrotik-connect
```

2. Install frontend dependencies:
```bash
cd front-end
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
front-end/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   ├── store/         # State management
│   └── types/         # TypeScript type definitions
├── public/            # Static assets
└── index.html         # Entry point
```

## Features in Detail

### Dashboard
- Real-time traffic monitoring
- Active user count
- System resources
- Quick actions

### Hotspot Management
- User creation and management
- Profile configuration
- Access restrictions
- Usage tracking

### Voucher System
- Batch generation
- Custom profiles
- Print templates
- Usage tracking

### Financial Reports
- Revenue tracking
- Usage statistics
- Transaction history
- Export capabilities

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- [MikroTik](https://mikrotik.com/) for their excellent router platform
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- All contributors who have helped shape this project

---

Made with ❤️ by [Your Name/Organization]
