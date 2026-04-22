# Classara

AI-powered teacher assistant for creating lesson plans and presentation slides.

## Features

- **Lesson Plan Generator** - Create detailed, structured lesson plans with customizable sections
- **Slide Generator** - Generate presentation slide structures from topics or content

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [OpenAI API](https://openai.com/) - AI-powered content generation
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/classara.git
cd classara
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add `OPENAI_API_KEY` to Environment Variables
4. Deploy

## License

MIT
