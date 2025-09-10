# 🎨 Wallpaper App Admin Panel

A comprehensive admin dashboard for managing wallpapers, categories, devices, and banners across multiple platforms including iPhone, Samsung, OnePlus, and General categories.

## ✨ Features

- **📱 Multi-Platform Support**: iPhone17, Samsung, OnePlus, General wallpaper categories
- **🖼️ Wallpaper Management**: Upload, edit, delete wallpapers with metadata
- **🏷️ Category System**: Main categories with subcategories and brand-specific categories
- **📱 Device Management**: Support for device series and iOS versions
- **🎯 Banner System**: App-specific banner management with nested structure
- **☁️ Cloud Storage**: AWS S3 integration with CloudFront CDN
- **🔄 Dual Database**: Firebase Firestore + Supabase integration
- **🎨 Modern UI**: Built with shadcn/ui and Tailwind CSS

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state
- **Database**: Firebase Firestore + Supabase (dual setup)
- **Storage**: AWS S3 with CloudFront CDN
- **Routing**: React Router DOM
- **Deployment**: Vercel

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/Azzy987/WallpapersAppAdminPanel.git
cd WallpapersAppAdminPanel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development server:
```bash
npm run dev
```

Visit `http://localhost:8080` to view the application.

## 🏗️ Database Structure

### Firebase Collections
- **`TrendingWallpapers`** - Main wallpapers collection
- **`Categories`** - Category definitions (main/brand types)
- **`Devices`** - Device compatibility data per brand
- **`Banners`** - Nested banner structure:
  ```
  Banners/
  ├── iPhone17Wallpapers/iPhone17/{wallpaper-id}
  ├── SamsungWallpapers/Samsung/{wallpaper-id}
  └── [AppName]Wallpapers/[AppName]/{wallpaper-id}
  ```
- **Brand Collections** (`Samsung`, `Apple`, etc.) - Brand-specific wallpapers

## 🎯 Key Features

### Category Management
- **Main Categories**: Trending wallpapers with subcategories
- **Brand Categories**: Device-specific wallpapers tied to models and launch years
- **Apple Categories**: Radio button selection between iPhone Devices vs iOS Versions

### Device Support
- **Samsung**: Predefined devices with launch year mappings (2019-2025)
- **Apple**: iPhone device series and iOS version support
- **Other Brands**: Custom device lists stored in Firestore

### Banner System
- **App-Specific Banners**: Separate banners for iPhone17, Samsung, OnePlus, General
- **Fixed Document Structure**: Uses predictable document names for mobile app tracking
- **Original Image URLs**: No CloudFront transformations for banner URLs

## 🛠️ Development Commands

```bash
npm run dev          # Start development server on port 8080
npm run build        # Production build
npm run build:dev    # Development build  
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

## 📝 Usage

1. **Add Wallpapers**: Use the upload form with category selection and device compatibility
2. **Manage Categories**: Create main/brand categories with subcategories
3. **Device Management**: Add device series and compatibility information
4. **Banner Management**: Create app-specific banners with automatic wallpaper linking
5. **Bulk Operations**: Edit thumbnails and manage wallpapers in bulk

## 🔗 Links

- **Repository**: [GitHub](https://github.com/Azzy987/WallpapersAppAdminPanel)

Built with ❤️ using React, TypeScript, and modern web technologies.