# Nutrition Tracker & AI Personal Assistant

A comprehensive, AI-powered nutrition management platform designed to help users reach their health goals through intelligent tracking, personalized meal planning, and detailed analysis. Built with modern web technologies and powered by the **Baidu Ernie 4.0** Large Language Model.

![Project Banner](public/og-image.png)

## 🚀 Live Demo

Experience the AI-powered nutrition tracker in action:
**[👉 View Live Demo](https://ernie-nutrition-tracker.vercel.app)**

## 🌟 Key Features

### 1. 📊 Smart Dashboard

- **"Fresh & Vitality" Design**: A modern, aesthetically pleasing interface featuring glassmorphism and vibrant visuals.
- **At-a-Glance Stats**: Instant view of daily calorie consumption, water intake, and macro distribution.
- **Quick Actions**: One-click access to log meals, analyze food, or chat with the AI.
- **Recent Activity**: detailed history of your latest interactions and logs.

### 2. 🍎 AI Food Analyzer

- **Image Recognition**: Upload photos of your meals to automatically detect food items and estimate nutrition facts.
- **Text Analysis**: Simply describe what you ate (e.g., "A bowl of beef noodles"), and the AI will calculate the macros.
- **Detailed Insights**: Get confidence scores, health benefits, health considerations, and detailed macronutrient breakdowns.
- **Save to Tracker**: Seamlessly add analyzed results to your daily food log.

### 3. 📝 Comprehensive Tracker

- **Meal Logging**: Dedicated sections for Breakfast, Lunch, Dinner, and Snacks.
- **Water Tracking**: Easy increment/decrement controls to monitor daily hydration.
- **Goal Monitoring**: Real-time progress bars comparing current intake against your personalized daily goals.
- **History View**: Navigate back in time to review past logs.

### 4. 🍽️ Intelligent Meal Planner

- **Custom Meal Plans**: Generate 7-day personalized meal plans based on your profile, dietary restrictions, and goals.
- **Variety Engine**: Smart logic ensures meal diversity to keep your diet interesting.
- **Ernie Bot Integration**: Uses advanced prompts to create culturally relevant and nutritionally balanced suggestions.
- **One-Click Save**: Store your favorite plans directly to the database.

### 5. 💬 Smart Nutrition Chatbot

- **Context-Aware Advice**: Chat with an AI assistant that understands your profile and goals.
- **Bilingual Support**: Full support for **English** and **Mandarin Chinese** (switchable in settings).
- **Persistent History**: Your conversations are saved, allowing for continuous context.

### 6. 📈 Daily Summaries & Reports

- **Trends & Charts**: Visualise your progress over the last 7 days, 30 days, or all time using interactive charts (`recharts`).
- **Diet Quality Score**: Get an AI-calculated score (e.g., "A", "B+") for your daily nutrition.
- **Macro Analysis**: Deep dive into protein, carb, and fat trends.

### 7. 👤 Personalized Profile

- **Custom Goals**: Set specific targets for Calories, Protein, Carbs, Fats, and Water.
- **Preferences**: Manage dietary restrictions (e.g., Vegan, Gluten-Free) and disliked foods.
- **App Settings**:
  - **Theme**: Toggle between Light, Dark, and System modes.
  - **Language**: Switch the entire app interface between English and Mandarin.
  - **Units**: Metric vs. Imperial support.

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: CSS Transitions & Micro-interactions

### Backend & Data

- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for food images)

### Artificial Intelligence

- **LLM**: [Baidu Ernie Bot 4.0](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/clntwmv7t) (via Qianfan API)
- **Capabilities**: Image Analysis, Natural Language Processing, Meal Generation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase Project
- Baidu Cloud Account (for Ernie API)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/nutrition-tracker.git
cd nutrition-tracker
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Baidu Ernie (Qianfan) API
ERNE_API_KEY=your_client_id
ERNE_SECRET_KEY=your_client_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── app/
│   ├── analyzer/        # Food analysis (Image/Text)
│   ├── api/             # Backend API routes
│   ├── chat/            # AI Chatbot interface
│   ├── daily-summaries/ # History & Reports
│   ├── meal-planner/    # Assessment & Plan Generation
│   ├── profile/         # User settings & goals
│   ├── tracker/         # Daily logging & goals
│   └── layout.tsx       # Main app shell
├── components/          # Reusable UI components
├── lib/                 # Utilities & Clients
└── public/              # Static assets
```

## 📄 License

This project was developed for educational use as part of the ERNIE Hackathon Application Task.
