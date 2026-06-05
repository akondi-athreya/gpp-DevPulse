# <p align="center">DevPulse</p>

<p align="center">
  <strong>The Real-Time Developer Social & Code Review Hub</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.7-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0.0-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-14-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-Upstash-FF4438?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Pusher-Realtime-29B6F6?style=for-the-badge&logo=pusher&logoColor=white" alt="Pusher" />
  <img src="https://img.shields.io/badge/Vitest-Testing-76E2B2?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
</p>

---

## 🌟 Introduction

**DevPulse** is a cutting-edge web application tailored for developers to share code snippets, engage in peer code reviews, build professional reputation, and compete on a global leaderboard. 

Designed with rich glassmorphism aesthetics, dynamic dark/light modes, and real-time synchronization, DevPulse bridges the gap between raw coding and collaborative social learning.

---

## 🚀 Key Features

*   **Syntax-Highlighted Code Feed**: Discover, filter, and sort code submissions. Submissions support tags, difficulty levels (Beginner to Expert), and languages.
*   **Deep Code Review Tool**: Select specific lines of code to write feedback, resolve comments, rate code quality, and help peers improve.
*   **Gamified Reputation & Leaderboards**: Earn reputation points when your posts get upvoted or receive positive reviews. Climb the leaderboard to show your expertise.
*   **Real-Time Live Notifications**: Instantly get notified of new reviews, votes, resolved comments, and milestone achievements, powered by Pusher.
*   **Vercel Blob Snapshots**: Upload visual code screenshots or rendering assets alongside raw code.
*   **High Performance API Rate Limiting**: sliding window rate limiter backed by Upstash Redis prevents spam and malicious traffic.
*   **Zero-Config Developer Fallback**: Don't have Pusher or Redis cloud accounts? DevPulse ships with fully functional local mock classes for Redis and Pusher, enabling local setup in seconds.
*   **Container Ready**: Comprehensive Docker and Docker Compose integrations for Postgres, Redis, and Next.js.

---

## 🏗️ System Architecture

DevPulse uses a modern decoupled architecture. Below is a diagram showing how the frontend, API middleware, databases, and third-party services connect:

```mermaid
flowchart TD
    Client[Browser Client] <--> |HTTPS / WSS| NextApp[Next.js 16 App Router]
    
    subgraph Middleware & Protection
        NextApp --> |Intercepts Requests| MW[middleware.ts]
        MW --> |Check Limit| LocalRedis[Upstash Redis / MockRedis]
        MW --> |Check JWT Session| NextAuth[Next-Auth / JWT]
    end

    subgraph Core Backend Logic
        NextApp --> |Server Actions / APIs| DBClient[Prisma Client v7]
        DBClient <--> |Read/Write| Postgres[(PostgreSQL DB)]
        
        NextApp --> |Upload Snapshots| VercelBlob[Vercel Blob Storage]
        NextApp --> |Dispatch Events| PusherChannel[Pusher Real-time WebSocket]
    end

    PusherChannel -.-> |Broadcast Events| Client
    VercelBlob -.-> |Deliver Images| Client
```

---

## 📊 Database Schema & ERD

DevPulse relies on PostgreSQL to manage relations. Below is the Entity-Relationship Diagram (ERD) mapping our [schema.prisma](file:///Users/akondiathreya/Documents/Development/GPP_Tasks/Week-24/DevPulse/prisma/schema.prisma):

```mermaid
classDiagram
    class User {
        String id
        String email
        String username
        String displayName
        String avatarUrl
        String githubId
        Int reputation
        String password
        DateTime createdAt
        DateTime updatedAt
    }

    class Submission {
        String id
        String title
        String description
        String codeContent
        String language
        SubmissionStatus status
        DifficultyTag difficultyTag
        Int viewCount
        DateTime createdAt
        DateTime updatedAt
        String authorId
    }

    class Review {
        String id
        String content
        Int lineReference
        Int rating
        Boolean isResolved
        DateTime createdAt
        DateTime updatedAt
        String submissionId
        String reviewerId
    }

    class Vote {
        String id
        VoteType voteType
        DateTime createdAt
        String submissionId
        String userId
    }

    class Tag {
        String id
        String name
        String color
    }

    class SubmissionTag {
        String submissionId
        String tagId
    }

    class CodeSnapshot {
        String id
        String imageUrl
        DateTime uploadedAt
        String submissionId
    }

    class Notification {
        String id
        NotificationType type
        String message
        Boolean isRead
        DateTime createdAt
        String userId
        Json metadata
    }

    class Session {
        String id
        String sessionToken
        String userId
        DateTime expires
    }

    User "1" --> "*" Submission : creates
    User "1" --> "*" Review : writes
    User "1" --> "*" Vote : casts
    User "1" --> "*" Notification : receives
    User "1" --> "*" Session : authenticates
    
    Submission "1" --> "*" Review : receives
    Submission "1" --> "*" Vote : collects
    Submission "1" --> "*" SubmissionTag : categorized_by
    Submission "1" --> "*" CodeSnapshot : captures
    
    Tag "1" --> "*" SubmissionTag : tag_mapping
```

---

## 🛠️ Technology Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `16.2.7` | App router, react server components (RSC) and typed routing. |
| **View Layer** | [React](https://react.dev/) | `19.2.4` | Virtual DOM rendering & Client-side interactivity. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `4.0.0` | Next-gen PostCSS-based utility CSS processing. |
| **Database ORM** | [Prisma](https://www.prisma.io/) | `7.8.0` | Typesafe schema modeling and DB client output wrapper. |
| **Primary Database** | [PostgreSQL](https://www.postgresql.org/) | `14` | Relational table storage & composite constraints. |
| **Cache & Rate Limit** | [Upstash Redis](https://upstash.com/) | `^1.38.0` | API routing sliding window protection & key expirations. |
| **Realtime Gateway** | [Pusher](https://pusher.com/) | `^5.3.3` | Low latency WebSocket publish-subscribe notification pipeline. |
| **Media Storage** | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | `^2.4.0` | Fast static assets & snapshot hosting. |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) | `v5.0.0-beta` | JWT session validation, credentials and OAuth (GitHub). |
| **Testing** | [Vitest](https://vitest.dev/) | `^4.1.8` | High performance ESM native unit & routing tests. |

---

## ⚙️ Environment Variables & Configuration

Copy the setup instructions from [.env.example](file:///Users/akondiathreya/Documents/Development/GPP_Tasks/Week-24/DevPulse/.env.example) to your local `.env` file. Here is the configuration spec:

| Variable | Required | Default / Example | Purpose / Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/devpulse` | Connection string for PostgreSQL database. |
| `NEXTAUTH_SECRET` | Yes | `dg4wG...ygzDE=` | Random salt used to sign NextAuth session JWT tokens. |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Base URL of your deployed application. |
| `AUTH_TRUST_HOST` | No | `true` | Tells NextAuth to trust proxy forward headers. |
| `GITHUB_CLIENT_ID` | No | `Ov23liT...sII` | GitHub OAuth client ID for passwordless authentication. |
| `GITHUB_CLIENT_SECRET`| No | `a192f...19b` | GitHub OAuth client secret keys. |
| `UPSTASH_REDIS_REST_URL`| No | `"https://...upstash.io"` | REST URL of your Upstash Redis database. *(Leave empty for local memory mock)*. |
| `UPSTASH_REDIS_REST_TOKEN`| No | `"gQAA..."` | Auth token for Redis. *(Leave empty for local memory mock)*. |
| `BLOB_READ_WRITE_TOKEN`| Yes | `"vercel_blob_rw_..."` | Token authorizing uploads to Vercel Blob. |
| `PUSHER_APP_ID` | No | `"1800000"` | Server-side Pusher app ID. *(Leave empty for local mock)*. |
| `NEXT_PUBLIC_PUSHER_KEY`| No | `"abc123xyz"` | Client-side Pusher key. *(Leave empty for local mock)*. |
| `PUSHER_SECRET` | No | `"sec987xyz"` | Pusher secret token. *(Leave empty for local mock)*. |
| `NEXT_PUBLIC_PUSHER_CLUSTER`| No | `"us2"` | Regional cluster endpoint for Pusher. |

> [!TIP]
> **Zero-Configuration Local Mode**: If `UPSTASH_REDIS_REST_URL` or `NEXT_PUBLIC_PUSHER_KEY` are not provided, DevPulse switches to local **mock modes** automatically (using `MockRedis` in [redis.ts](file:///Users/akondiathreya/Documents/Development/GPP_Tasks/Week-24/DevPulse/lib/redis.ts) and `MockPusher` in [pusher.ts](file:///Users/akondiathreya/Documents/Development/GPP_Tasks/Week-24/DevPulse/lib/pusher.ts)). You don't need cloud credentials to start developing!

---

## 🏃 Getting Started

### Prerequisites
Make sure you have [Node.js v20+](https://nodejs.org/) and [Docker Desktop](https://www.docker.com/) installed on your machine.

---

### Method A: Native Local Development

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/DevPulse.git
    cd DevPulse
    ```

2.  **Install Dependencies**:
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Start Local Postgres and Redis Containers**:
    You can easily boot up Postgres and Redis using our helper config:
    ```bash
    docker-compose up db cache -d
    ```

4.  **Setup Environment Variables**:
    Create a `.env` file at the project root:
    ```bash
    cp .env.example .env
    ```
    Ensure your `DATABASE_URL` matches the docker credentials:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devpulse?schema=public"
    NEXTAUTH_SECRET="your-generated-nextauth-secret-here"
    NEXTAUTH_URL="http://localhost:3000"
    BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
    ```

5.  **Initialize Database & Prisma Client**:
    Generate the typesafe client and run database migrations:
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```

6.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

---

### Method B: Full Docker Compose Development
To boot the entire stack (Next.js server, PostgreSQL, Redis) in unified containers:

1.  **Create `.env` File**:
    Ensure environmental variables are populated.
2.  **Spin Up the Stack**:
    ```bash
    docker-compose up --build
    ```
3.  **Access App**:
    The service is exposed at [http://localhost:3000](http://localhost:3000).

---

## 📐 Prisma 7 Database Commands

We use Prisma for complete model safety. Here are the core commands you'll use:

*   **Format schema**:
    ```bash
    npx prisma format
    ```
*   **Validate configuration**:
    ```bash
    npx prisma validate
    ```
*   **Generate Client**: Generates the schema client into the project-specific path [app/generated/prisma](file:///Users/akondiathreya/Documents/Development/GPP_Tasks/Week-24/DevPulse/app/generated/prisma):
    ```bash
    npx prisma generate
    ```
*   **Create/Apply Migrations**:
    ```bash
    npx prisma migrate dev --name <migration_name>
    ```
*   **Open Prisma Studio GUI**:
    ```bash
    npx prisma studio
    ```

---

## 🧪 Testing

Testing is set up using **Vitest**. The suite runs unit testing on API route utilities, middlewares, and helper modules.

*   **Run tests once**:
    ```bash
    npx vitest run
    ```
*   **Run tests in watch mode**:
    ```bash
    npx vitest
    ```
*   **Check coverage**:
    ```bash
    npx vitest run --coverage
    ```

Unit tests reside in the [tests](file:///Users/akondiathreya/Documents/Development/GPP_Tasks/Week-24/DevPulse/tests) folder. Refer to [api.test.ts](file:///Users/akondiathreya/Documents/Development/GPP_Tasks/Week-24/DevPulse/tests/api.test.ts) for reference.

---

## 📂 Project Structure

```text
├── app/
│   ├── (auth)/             # Login & Registration Pages
│   ├── (dashboard)/        # Main feeds, Leaderboard, Submissions, Reviews, Profiles
│   ├── actions/            # Next.js Server Actions
│   ├── api/                # REST endpoint routers (Rate limited & secure)
│   ├── generated/          # Auto-generated Prisma client classes
│   ├── globals.css         # Main styles (includes Custom scrollbars, glassmorphism utilities)
│   ├── layout.tsx          # Root Layout config
│   └── page.tsx            # Root redirect entrypoint
├── components/
│   ├── forms/              # Login, register, and submit forms
│   ├── notifications/      # Real-time event popovers
│   ├── review/             # Code block inline feedback tools
│   ├── submission/         # Snippet cards and filtering layouts
│   └── ui/                 # Design elements (Header, buttons, skeletons)
├── hooks/
│   └── useNotifications.ts # Realtime Pusher state listener hooks
├── lib/
│   ├── auth.ts             # Auth handlers, credential check & session accessors
│   ├── prisma.ts           # Prisma singleton instantiation
│   ├── pusher.ts           # Realtime pusher client/server connection + fallback mock
│   ├── rate-limit.ts       # Upstash sliding-window token bucket logic
│   ├── redis.ts            # Key-value client wrappers + in-memory fallback mock
│   ├── utils.ts            # Formatting, styling mixers, vote action calculations
│   └── validations.ts      # Input validator schemas using Zod
├── prisma/
│   ├── migrations/         # Database migration history
│   └── schema.prisma       # Database schema models definitions
├── public/                 # Static items (Favicon, assets)
└── tests/                  # Unit tests (Vitest suite)
```

---

## 🚢 Production Deployment

### Building the Bundle
To test the production build locally:
```bash
npm run build
npm run start
```

### Deploying to Vercel
1. Link your repo to Vercel.
2. Configure the required environment variables.
3. Add the Vercel Blob Integration to your project configuration.
4. Set the framework option to **Next.js**.

---

## 🤝 Contribution Guidelines
We welcome community pull requests! To contribute:
1. Fork the repo and create your branch (`feature/amazing-feature`).
2. Make sure your code passes formatting (`npx eslint` / `npx prisma format`).
3. Verify your changes don't break existing features by running tests (`npx vitest run`).
4. Open a Pull Request detailing your changes.

---
*Developed with ❤️ by the DevPulse team. Streamline your review cycle.*
