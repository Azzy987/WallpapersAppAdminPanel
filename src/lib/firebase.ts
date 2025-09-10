import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  deleteDoc
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEth9uBcIB9NpG8L45NvYbJn_9iD-Wyyw",
  authDomain: "wallpaper-apps-cad2c.firebaseapp.com",
  projectId: "wallpaper-apps-cad2c",
  storageBucket: "wallpaper-apps-cad2c.firebasestorage.app",
  messagingSenderId: "352408897001",
  appId: "1:352408897001:web:cb20f5ebc4ca6bafd1f778",
  measurementId: "G-GPGG6DSYSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Collection references
const trendingWallpapersRef = collection(db, "TrendingWallpapers");
const bannersRef = collection(db, "Banners");
const categoriesRef = collection(db, "Categories");
const devicesRef = collection(db, "Devices");

// Types
export interface Category {
  categoryName: string;
  categoryType: 'main' | 'brand';
  thumbnail: string;
  subcategories?: string[];
}

export interface Device {
  devices: string[];
  iosVersions?: string[];
}

// Main categories with subcategories
export const mainCategories = {
  "AMOLED & Dark": [],
  "4K & Ultra HD": [],
  "Minimal & Aesthetic": ["Abstract", "Gradient", "Typography"],
  "Nature & Landscapes": ["Mountains", "Beaches", "Forests", "Sky & Clouds"],
  "Anime & Gaming": ["Anime Characters", "Gaming Characters", "Fantasy Worlds"]
};

// Samsung device models from 2019 onwards
export const samsungDeviceModels = [
  // S Series
  "Galaxy S25 series",
  "Galaxy S24 series", 
  "Galaxy S23 series",
  "Galaxy S22 series",
  "Galaxy S21 series",
  "Galaxy S20 series",
  "Galaxy S10 series",
  
  // Note Series
  "Galaxy Note 20 series",
  "Galaxy Note 10 series",
  
  // Z Fold Series
  "Galaxy Z Fold 7",
  "Galaxy Z Fold 6",
  "Galaxy Z Fold 5",
  "Galaxy Z Fold 4",
  "Galaxy Z Fold 3",
  "Galaxy Z Fold 2",
  "Galaxy Fold",
  
  // Z Flip Series
  "Galaxy Z Flip 7",
  "Galaxy Z Flip 6",
  "Galaxy Z Flip 5",
  "Galaxy Z Flip 4",
  "Galaxy Z Flip 3",
  "Galaxy Z Flip",
  
  // A Series
  "Galaxy A56",
  "Galaxy A55",
  "Galaxy A54",
  "Galaxy A53",
  "Galaxy A52",
  "Galaxy A51",
  "Galaxy A50",
  "Galaxy A36",
  "Galaxy A35",
  "Galaxy A34",
  "Galaxy A33",
  "Galaxy A32",
  "Galaxy A31",
  "Galaxy A30",
  "Galaxy A25",
  "Galaxy A24",
  "Galaxy A23",
  "Galaxy A22",
  "Galaxy A21",
  "Galaxy A20",
  "Galaxy A16",
  "Galaxy A15",
  "Galaxy A14",
  "Galaxy A13",
  "Galaxy A12",
  "Galaxy A11",
  "Galaxy A10",
  "Galaxy A05",
  "Galaxy A04",
  "Galaxy A03",
  "Galaxy A02",
  "Galaxy A01",
  "Galaxy A90",
  "Galaxy A80",
  "Galaxy A73",
  "Galaxy A72",
  "Galaxy A71",
  "Galaxy A70",
  
  // M Series
  "Galaxy M62",
  "Galaxy M55",
  "Galaxy M54",
  "Galaxy M53",
  "Galaxy M52",
  "Galaxy M51",
  "Galaxy M42",
  "Galaxy M40",
  "Galaxy M35",
  "Galaxy M34",
  "Galaxy M33",
  "Galaxy M32",
  "Galaxy M31",
  "Galaxy M30",
  "Galaxy M23",
  "Galaxy M21",
  "Galaxy M20",
  "Galaxy M15",
  "Galaxy M14",
  "Galaxy M13",
  "Galaxy M12",
  "Galaxy M11",
  "Galaxy M10",
  
  // F Series
  "Galaxy F55",
  "Galaxy F35",
  "Galaxy F15"
];

// Samsung device launch year mapping
export const samsungDeviceYearMap: { [key: string]: number } = {
  // 2019
  "Galaxy S10 series": 2019,
  "Galaxy Note 10 series": 2019,
  "Galaxy Fold": 2019,
  "Galaxy A10": 2019,
  "Galaxy A20": 2019,
  "Galaxy A30": 2019,
  "Galaxy A50": 2019,
  "Galaxy A70": 2019,
  "Galaxy A80": 2019,
  "Galaxy A90": 2019,
  "Galaxy M10": 2019,
  "Galaxy M20": 2019,
  "Galaxy M30": 2019,
  "Galaxy M40": 2019,
  
  // 2020
  "Galaxy S20 series": 2020,
  "Galaxy Note 20 series": 2020,
  "Galaxy Z Flip": 2020,
  "Galaxy Z Fold 2": 2020,
  "Galaxy A01": 2020,
  "Galaxy A11": 2020,
  "Galaxy A21": 2020,
  "Galaxy A31": 2020,
  "Galaxy A51": 2020,
  "Galaxy A71": 2020,
  "Galaxy M11": 2020,
  "Galaxy M21": 2020,
  "Galaxy M31": 2020,
  "Galaxy M51": 2020,
  
  // 2021
  "Galaxy S21 series": 2021,
  "Galaxy Z Fold 3": 2021,
  "Galaxy Z Flip 3": 2021,
  "Galaxy A02": 2021,
  "Galaxy A12": 2021,
  "Galaxy A22": 2021,
  "Galaxy A32": 2021,
  "Galaxy A52": 2021,
  "Galaxy A72": 2021,
  "Galaxy M12": 2021,
  "Galaxy M32": 2021,
  "Galaxy M42": 2021,
  "Galaxy M52": 2021,
  "Galaxy M62": 2021,
  
  // 2022
  "Galaxy S22 series": 2022,
  "Galaxy Z Fold 4": 2022,
  "Galaxy Z Flip 4": 2022,
  "Galaxy A03": 2022,
  "Galaxy A13": 2022,
  "Galaxy A23": 2022,
  "Galaxy A33": 2022,
  "Galaxy A53": 2022,
  "Galaxy A73": 2022,
  "Galaxy M13": 2022,
  "Galaxy M23": 2022,
  "Galaxy M33": 2022,
  "Galaxy M53": 2022,
  
  // 2023
  "Galaxy S23 series": 2023,
  "Galaxy Z Fold 5": 2023,
  "Galaxy Z Flip 5": 2023,
  "Galaxy A04": 2023,
  "Galaxy A14": 2023,
  "Galaxy A24": 2023,
  "Galaxy A34": 2023,
  "Galaxy A54": 2023,
  "Galaxy M14": 2023,
  "Galaxy M34": 2023,
  "Galaxy M54": 2023,
  
  // 2024
  "Galaxy S24 series": 2024,
  "Galaxy Z Fold 6": 2024,
  "Galaxy Z Flip 6": 2024,
  "Galaxy A05": 2024,
  "Galaxy A15": 2024,
  "Galaxy A25": 2024,
  "Galaxy A35": 2024,
  "Galaxy A55": 2024,
  "Galaxy M15": 2024,
  "Galaxy M35": 2024,
  "Galaxy M55": 2024,
  "Galaxy F15": 2024,
  "Galaxy F35": 2024,
  "Galaxy F55": 2024,
  
  // 2025
  "Galaxy S25 series": 2025,
  "Galaxy Z Fold 7": 2025,
  "Galaxy Z Flip 7": 2025,
  "Galaxy A16": 2025,
  "Galaxy A36": 2025,
  "Galaxy A56": 2025
};

// Function to add a new trending wallpaper
export const addTrendingWallpaper = async (wallpaper) => {
  try {
    // If no subcategory is selected but a main category is, set subcategory to "None"
    if (wallpaper.category && !wallpaper.subCategory) {
      wallpaper.subCategory = "None";
    }
    
    const docRef = await addDoc(trendingWallpapersRef, {
      ...wallpaper,
      timestamp: serverTimestamp(),
      downloads: 0,
      views: 0
    });
    console.log("Trending wallpaper added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding trending wallpaper: ", error);
    throw error;
  }
};

// Function to add a new trending wallpaper with a specific ID
export const addTrendingWallpaperWithId = async (id: string, wallpaper) => {
  try {
    // If no subcategory is selected but a main category is, set subcategory to "None"
    if (wallpaper.category && !wallpaper.subCategory) {
      wallpaper.subCategory = "None";
    }
    
    await setDoc(doc(db, "TrendingWallpapers", id), {
      ...wallpaper,
      timestamp: serverTimestamp(),
      downloads: 0,
      views: 0
    });
    console.log("Trending wallpaper added with ID: ", id);
    return id;
  } catch (error) {
    console.error("Error adding trending wallpaper: ", error);
    throw error;
  }
};

// Function to add a new brand wallpaper
export const addBrandWallpaper = async (brand, wallpaper) => {
  try {
    // If no subcategory is selected but a main category is, set subcategory to "None"
    if (wallpaper.category && !wallpaper.subCategory) {
      wallpaper.subCategory = "None";
    }
    
    const brandRef = collection(db, brand);
    const docRef = await addDoc(brandRef, {
      ...wallpaper,
      timestamp: serverTimestamp(),
      downloads: 0,
      views: 0
    });
    console.log(`${brand} wallpaper added with ID: `, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding ${brand} wallpaper: `, error);
    throw error;
  }
};

// Function to add a new brand wallpaper with a specific ID
export const addBrandWallpaperWithId = async (brand, id, wallpaper) => {
  try {
    // If no subcategory is selected but a main category is, set subcategory to "None"
    if (wallpaper.category && !wallpaper.subCategory) {
      wallpaper.subCategory = "None";
    }
    
    // Convert launchYear to number for Samsung
    const finalWallpaper = { ...wallpaper };
    if (brand === 'Samsung' && finalWallpaper.launchYear) {
      finalWallpaper.launchYear = Number(finalWallpaper.launchYear);
    }
    
    await setDoc(doc(db, brand, id), {
      ...finalWallpaper,
      timestamp: serverTimestamp(),
      downloads: 0,
      views: 0
    });
    console.log(`${brand} wallpaper added with ID: `, id);
    return id;
  } catch (error) {
    console.error(`Error adding ${brand} wallpaper: `, error);
    throw error;
  }
};

// Function to add a new banner
export const addBanner = async (banner) => {
  try {
    const docRef = await addDoc(bannersRef, banner);
    console.log("Banner added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding banner: ", error);
    throw error;
  }
};

// Function to add a new banner with a specific ID
export const addBannerWithId = async (id, banner) => {
  try {
    await setDoc(doc(db, "Banners", id), banner);
    console.log("Banner added with ID: ", id);
    return id;
  } catch (error) {
    console.error("Error adding banner: ", error);
    throw error;
  }
};

// Function to add a new category
export const addCategory = async (category) => {
  try {
    const categoryData: any = {
      categoryType: category.categoryType,
      thumbnail: category.thumbnail
    };
    
    // Add subcategories if this is a main category with subcategories
    if (category.categoryType === 'main' && mainCategories[category.categoryName]) {
      categoryData.subcategories = mainCategories[category.categoryName];
    }
    
    await setDoc(doc(categoriesRef, category.categoryName), categoryData);
    console.log("Category added: ", category.categoryName);
    return category.categoryName;
  } catch (error) {
    console.error("Error adding category: ", error);
    throw error;
  }
};

// Function to update a wallpaper
export const updateWallpaper = async (collectionName: string, id: string, data: any) => {
  try {
    // If no subcategory is selected but a main category is, set subcategory to "None"
    if (data.category && !data.subCategory) {
      data.subCategory = "None";
    }
    
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
    console.log(`${collectionName} wallpaper updated with ID: `, id);
    return id;
  } catch (error) {
    console.error(`Error updating ${collectionName} wallpaper: `, error);
    throw error;
  }
};

// Function to delete a wallpaper
export const deleteWallpaper = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    console.log(`${collectionName} wallpaper deleted with ID: `, id);
    return id;
  } catch (error) {
    console.error(`Error deleting ${collectionName} wallpaper: `, error);
    throw error;
  }
};

// Function to delete all wallpapers in a category
export const deleteWallpapersByCategory = async (collectionName: string, categoryName: string) => {
  try {
    let wallpapers;
    let wallpapersToDelete;
    
    if (collectionName === 'Samsung') {
      wallpapers = await getAllWallpapersForBrand(collectionName);
      wallpapersToDelete = wallpapers.filter(wallpaper => 
        wallpaper.data.series === categoryName
      );
    } else if (collectionName === 'TrendingWallpapers') {
      wallpapers = await getAllTrendingWallpapers();
      wallpapersToDelete = wallpapers.filter(wallpaper => 
        wallpaper.data.category === categoryName
      );
    } else {
      throw new Error(`Unsupported collection: ${collectionName}`);
    }
    
    const deletePromises = wallpapersToDelete.map(wallpaper => 
      deleteWallpaper(collectionName, wallpaper.id)
    );
    
    await Promise.all(deletePromises);
    console.log(`All wallpapers in category ${categoryName} deleted from ${collectionName}`);
    return wallpapersToDelete.length;
  } catch (error) {
    console.error(`Error deleting wallpapers in category ${categoryName}:`, error);
    throw error;
  }
};

// Function to get all categories
export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(categoriesRef);
    const categories = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        categoryName: doc.id,
        categoryType: data.categoryType,
        thumbnail: data.thumbnail
      });
    });
    return categories;
  } catch (error) {
    console.error("Error getting categories: ", error);
    throw error;
  }
};

// Function to get devices for a specific brand
export const getDevices = async (brand) => {
  try {
    const docRef = doc(devicesRef, brand);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No devices found for brand: ", brand);
      return {
        devices: []
      };
    }
  } catch (error) {
    console.error("Error getting devices: ", error);
    throw error;
  }
};

// Function to check if a wallpaper with a given URL already exists
export const checkDuplicateWallpaper = async (imageUrl) => {
  try {
    // Check in TrendingWallpapers
    const trendingQuery = query(trendingWallpapersRef, where("imageUrl", "==", imageUrl));
    const trendingSnapshot = await getDocs(trendingQuery);
    
    if (!trendingSnapshot.empty) {
      return true;
    }
    
    // Check in brand collections
    const brandCategories = (await getCategories()).filter(cat => cat.categoryType === 'brand');
    
    for (const category of brandCategories) {
      const brand = category.categoryName;
      const brandRef = collection(db, brand);
      const brandQuery = query(brandRef, where("imageUrl", "==", imageUrl));
      const brandSnapshot = await getDocs(brandQuery);
      
      if (!brandSnapshot.empty) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking duplicate wallpaper: ", error);
    throw error;
  }
};

// Function to get wallpaper ID by URL
export const getWallpaperIdByUrl = async (imageUrl) => {
  try {
    const results = [];
    
    // Check TrendingWallpapers
    const trendingQuery = query(trendingWallpapersRef, where("imageUrl", "==", imageUrl));
    const trendingSnapshot = await getDocs(trendingQuery);
    
    trendingSnapshot.forEach(doc => {
      results.push({
        id: doc.id,
        collection: 'TrendingWallpapers',
        data: doc.data()
      });
    });
    
    // Check in brand collections
    const brandCategories = (await getCategories()).filter(cat => cat.categoryType === 'brand');
    
    for (const category of brandCategories) {
      const brand = category.categoryName;
      const brandRef = collection(db, brand);
      const brandQuery = query(brandRef, where("imageUrl", "==", imageUrl));
      const brandSnapshot = await getDocs(brandQuery);
      
      brandSnapshot.forEach(doc => {
        results.push({
          id: doc.id,
          collection: brand,
          data: doc.data()
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error getting wallpaper by URL: ", error);
    throw error;
  }
};

// Function to get banner by URL
export const getBannerByWallpaperUrl = async (imageUrl) => {
  try {
    // Transform the URL to match the banner URL format (with 'h' before extension)
    const getUrlWithH = (url) => {
      const lastDotIndex = url.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        return `${url.substring(0, lastDotIndex)}h${url.substring(lastDotIndex)}`;
      }
      return url;
    };
    
    const bannerUrl = getUrlWithH(imageUrl);
    
    const bannerQuery = query(bannersRef, where("bannerUrl", "==", bannerUrl));
    const bannerSnapshot = await getDocs(bannerQuery);
    
    if (bannerSnapshot.empty) {
      return null;
    }
    
    const bannerDoc = bannerSnapshot.docs[0];
    return {
      id: bannerDoc.id,
      data: bannerDoc.data()
    };
  } catch (error) {
    console.error("Error getting banner by URL: ", error);
    throw error;
  }
};

// Function to remove wallpaper and related items
export const removeWallpaper = async (imageUrl) => {
  try {
    const removedItems = [];
    
    // Get all wallpapers with this URL
    const wallpapers = await getWallpaperIdByUrl(imageUrl);
    
    // Delete each wallpaper
    for (const wallpaper of wallpapers) {
      if (wallpaper.collection === 'TrendingWallpapers') {
        await deleteDoc(doc(db, "TrendingWallpapers", wallpaper.id));
        removedItems.push(`Trending: ${wallpaper.id}`);
      } else {
        // wallpaper.collection is the brand name
        await deleteDoc(doc(db, wallpaper.collection, wallpaper.id));
        removedItems.push(`${wallpaper.collection}: ${wallpaper.id}`);
      }
    }
    
    // Check for banner
    const banner = await getBannerByWallpaperUrl(imageUrl);
    if (banner) {
      await deleteDoc(doc(db, "Banners", banner.id));
      removedItems.push(`Banner: ${banner.id}`);
    }
    
    return removedItems;
  } catch (error) {
    console.error("Error removing wallpaper: ", error);
    throw error;
  }
};

// Function to get all trending wallpapers
export const getAllTrendingWallpapers = async () => {
  try {
    const snapshot = await getDocs(trendingWallpapersRef);
    const wallpapers = [];
    
    snapshot.forEach(doc => {
      wallpapers.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    return wallpapers;
  } catch (error) {
    console.error("Error getting trending wallpapers: ", error);
    throw error;
  }
};

// Function to get all brand categories
export const getBrandCategories = async () => {
  try {
    const categories = await getCategories();
    return categories
      .filter(cat => cat.categoryType === 'brand')
      .map(cat => cat.categoryName);
  } catch (error) {
    console.error("Error getting brand categories: ", error);
    throw error;
  }
};

// Function to get all device series for a brand
export const getBrandDevices = async (brand) => {
  try {
    const deviceData = await getDevices(brand);
    if (!deviceData || !deviceData.devices) {
      return [];
    }
    return deviceData.devices;
  } catch (error) {
    console.error("Error getting brand devices: ", error);
    throw error;
  }
};

// Function to get all wallpapers for a specific brand
export const getAllWallpapersForBrand = async (brand) => {
  try {
    const brandRef = collection(db, brand);
    const snapshot = await getDocs(brandRef);
    const wallpapers = [];
    
    snapshot.forEach(doc => {
      wallpapers.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    return wallpapers;
  } catch (error) {
    console.error(`Error getting wallpapers for ${brand}: `, error);
    throw error;
  }
};

// Function to get all wallpapers for a specific brand and device series
export const getAllWallpapersForBrandDevice = async (brand: string, deviceSeries: string) => {
  try {
    const brandRef = collection(db, brand);
    const deviceQuery = query(brandRef, where("series", "==", deviceSeries));
    const snapshot = await getDocs(deviceQuery);
    const wallpapers = [];
    
    snapshot.forEach(doc => {
      wallpapers.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    return wallpapers;
  } catch (error) {
    console.error(`Error getting wallpapers for ${brand} ${deviceSeries}: `, error);
    throw error;
  }
};

// Function to get analytics data
export const getAnalyticsData = async () => {
  try {
    // Get total wallpapers
    const trendingSnapshot = await getDocs(trendingWallpapersRef);
    let totalWallpapers = trendingSnapshot.size;
    let trendingWallpapers = trendingSnapshot.size;
    
    // Get brand wallpapers
    const brandCategories = (await getCategories()).filter((cat) => cat.categoryType === "brand");
    const brandWallpapers = {};
    
    for (const brand of brandCategories.map((cat) => cat.categoryName)) {
      try {
        const brandRef = collection(db, brand);
        const brandSnapshot = await getDocs(brandRef);
        totalWallpapers += brandSnapshot.size;
        brandWallpapers[brand] = brandSnapshot.size;
      } catch (error) {
        console.error(`Error getting ${brand} wallpapers:`, error);
        brandWallpapers[brand] = 0;
      }
    }
    
    // Get categories count
    const categoriesSnapshot = await getDocs(categoriesRef);
    const totalCategories = categoriesSnapshot.size;
    
    // Get total downloads (sum of all downloads)
    let totalDownloads = 0;
    trendingSnapshot.forEach((doc) => {
      const data = doc.data();
      totalDownloads += data.downloads || 0;
    });
    
    // Count download numbers from brand collections as well
    for (const brand of brandCategories.map((cat) => cat.categoryName)) {
      try {
        const brandRef = collection(db, brand);
        const brandSnapshot = await getDocs(brandRef);
        brandSnapshot.forEach((doc) => {
          const data = doc.data();
          totalDownloads += data.downloads || 0;
        });
      } catch (error) {
        console.error(`Error getting ${brand} download counts:`, error);
      }
    }
    
    // Use placeholder values for active users and tags for now
    const activeUsers = 1420; // Placeholder value for now
    const totalTags = 96; // Placeholder value for now
    
    return {
      activeUsers,
      totalDownloads,
      totalWallpapers,
      totalCategories,
      totalTags,
      trendingWallpapers,
      brandWallpapers
    };
  } catch (error) {
    console.error("Error getting analytics data: ", error);
    // Return default values if there's an error
    return {
      activeUsers: 0,
      totalDownloads: 0,
      totalWallpapers: 0,
      totalCategories: 0,
      totalTags: 0,
      trendingWallpapers: 0,
      brandWallpapers: {}
    };
  }
};

// Function to get subcategories for a main category
export const getSubcategories = async (categoryName: string) => {
  try {
    const docRef = doc(categoriesRef, categoryName);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.subcategories || [];
    }
    
    // If not in database, check predefined list
    return mainCategories[categoryName] || [];
  } catch (error) {
    console.error("Error getting subcategories: ", error);
    throw error;
  }
};

// Function to update devices for a brand (append instead of overwrite)
export const updateDevices = async (brand: string, newDevices: string[], iosVersions?: string[]) => {
  try {
    const docRef = doc(devicesRef, brand);
    const docSnap = await getDoc(docRef);
    
    let existingDevices: string[] = [];
    let existingIosVersions: string[] = [];
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      existingDevices = data.devices || [];
      existingIosVersions = data.iosVersions || [];
    }
    
    // Merge devices (avoid duplicates)
    const mergedDevices = [...new Set([...existingDevices, ...newDevices])];
    
    const updateData: any = {
      devices: mergedDevices
    };
    
    // Merge iOS versions if provided
    if (iosVersions && iosVersions.length > 0) {
      const mergedIosVersions = [...new Set([...existingIosVersions, ...iosVersions])];
      updateData.iosVersions = mergedIosVersions;
    } else if (existingIosVersions.length > 0) {
      updateData.iosVersions = existingIosVersions;
    }
    
    await setDoc(docRef, updateData);
    console.log(`Devices updated for ${brand}:`, updateData);
    return updateData;
  } catch (error) {
    console.error(`Error updating devices for ${brand}:`, error);
    throw error;
  }
};

// Function to initialize Samsung devices from the predefined list
export const initializeSamsungDevices = async () => {
  try {
    // Remove duplicates from the Samsung device models
    const uniqueSamsungDevices = [...new Set(samsungDeviceModels)];
    
    await setDoc(doc(devicesRef, 'Samsung'), {
      devices: uniqueSamsungDevices
    });
    
    console.log('Samsung devices initialized successfully');
    return uniqueSamsungDevices;
  } catch (error) {
    console.error('Error initializing Samsung devices:', error);
    throw error;
  }
};

export { app, db, storage };
