# 🎓 ECHO - Educational Campus AI Platform

> Transform your learning experience with AI-powered notebooks, intelligent peer matching, and collaborative study sessions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RITHIKKUMARAN/Echo)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)

## ✨ Features

### 🧠 Neural Notebook
- AI-powered document analysis with Gemini 2.0
- Upload PDFs, PPTX, DOCX, TXT files
- Contextual AI chat with your documents
- Auto-extraction of study topics

### 🤝 Peer Connect
- Smart peer matching based on study topics
- Real-time chat with connected peers
- Professor badge system
- Topic overlap visualization

### 📚 Study Sessions
- Schedule and join study sessions
- Track study history
- Session analytics

### 💬 Doubt Forum
- Ask questions to the community
- Get AI-powered answer suggestions
- Upvote/downvote system

## 🚀 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Firebase Functions (Node.js 20)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **AI**: Google Gemini 2.0
- **3D Graphics**: Three.js, React Three Fiber
- **Animations**: Framer Motion, GSAP

## 📦 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/RITHIKKUMARAN/Echo.git
cd Echo
```

2. **Install dependencies**
```bash
npm install
cd functions
npm install
cd ..
```

3. **Configure environment variables**

Create `.env.local` in root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/your_project_id/us-central1
```

4. **Run Firebase emulators (optional)**
```bash
firebase emulators:start
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 🌐 Production Deployment

### 🎯 **100% Free Tier Deployment** (Recommended)

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete step-by-step instructions.

**Quick Deploy:**

1. **Deploy Firebase Backend**
```bash
firebase login
firebase deploy --only firestore:rules,storage,functions
```

2. **Deploy Frontend to Vercel**
```bash
npm i -g vercel
vercel --prod
```

Or use the **Deploy to Vercel** button above!

## 📊 Free Tier Limits

All services are FREE with generous limits:
- ✅ Vercel: 100GB bandwidth/month
- ✅ Firebase Functions: 2M invocations/month
- ✅ Firestore: 50K reads/day
- ✅ Firebase Storage: 5GB total
- ✅ Firebase Auth: 10K users/month

Perfect for **1000+ active users** at zero cost!

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging ID | ✅ Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | ✅ Yes |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API Key | ✅ Yes |
| `NEXT_PUBLIC_API_BASE_URL` | Backend Functions URL | ✅ Yes |

## 🏗️ Project Structure

```
echo_platform/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── dashboard/    # Protected dashboard routes
│   │   ├── login/        # Authentication pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   ├── lib/              # Utilities & services
│   │   ├── firebase.ts   # Firebase config
│   │   └── sheetsService.ts
│   └── styles/           # Global styles
├── functions/            # Firebase Functions (Backend)
│   ├── src/
│   │   ├── index.ts      # Main functions export
│   │   └── services/     # Business logic
│   └── package.json
├── public/               # Static assets
├── vercel.json           # Vercel config
├── firebase.json         # Firebase config
└── package.json          # Dependencies
```

## 🛠️ Development Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Firebase Commands
firebase emulators:start        # Start all emulators
firebase deploy --only functions # Deploy functions only
firebase deploy                  # Deploy everything
```

## 🧪 Testing

```bash
# Test Firebase Functions locally
cd functions
npm run build
firebase emulators:start --only functions

# Test Frontend
npm run dev
# Visit http://localhost:3000
```

## 🔒 Security

- Firebase Authentication for user management
- Firestore security rules for data protection
- Storage rules for file upload restrictions
- API key restrictions via Google Cloud Console
- Environment variable protection
- CORS configuration for API endpoints

See `firestore.rules` and `storage.rules` for security configurations.

## 📈 Performance

- **Lighthouse Score**: 90+ on all metrics
- **Server-Side Rendering** with Next.js 16
- **Code Splitting**: Automatic via Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: Vercel Edge Network CDN
- **Lazy Loading**: React Suspense & dynamic imports

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Rithik Kumaran K**
- GitHub: [@RITHIKKUMARAN](https://github.com/RITHIKKUMARAN)
- Email: [Contact via GitHub]

## 🙏 Acknowledgments

- Google Gemini AI for intelligent features
- Firebase for backend infrastructure
- Vercel for seamless deployment
- Next.js team for the amazing framework
- Open source community

## 📞 Support

- **Documentation**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/RITHIKKUMARAN/Echo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RITHIKKUMARAN/Echo/discussions)

---

**Made with ❤️ by Rithik Kumaran K** | **Powered by AI** | **Deployed for FREE**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RITHIKKUMARAN/Echo)
