import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { campusList } from '../components/campusList';

interface CampusContextValue {
  getCampusLevel: (campus: string) => number;
  setCampusLevel: (campus: string, level: number) => Promise<void>;
  campusLevels: Record<string, number>;
  loading: boolean;
}

const CampusContext = createContext<CampusContextValue | undefined>(undefined);

export const useCampus = () => {
  const ctx = useContext(CampusContext);
  if(!ctx) throw new Error('useCampus must be used within CampusProvider');
  return ctx;
};

export const CampusProvider = ({ children }: { children: ReactNode }) => {
  const [campusLevels, setCampusLevels] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load campus levels from Firebase
  useEffect(() => {
    const loadCampusLevels = async () => {
      try {
        const docRef = doc(db, 'system', 'campusLevels');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Loaded campus levels from Firebase:', data.levels);
          setCampusLevels(data.levels || {});
        } else {
          // Default levels for all campuses
          const defaultLevels: Record<string, number> = {};
          campusList.filter(campus => campus !== 'All Campus').forEach(campus => {
            defaultLevels[campus] = 2; // Default to level 2
          });
          console.log('No campus levels found in Firebase, using defaults:', defaultLevels);
          setCampusLevels(defaultLevels);
        }
      } catch (error) {
        console.error('Failed to load campus levels:', error);
        // Fallback to default
        const fallbackLevels: Record<string, number> = {};
        campusList.filter(campus => campus !== 'All Campus').forEach(campus => {
          fallbackLevels[campus] = 2; // Default to level 2
        });
        setCampusLevels(fallbackLevels);
      } finally {
        setLoading(false);
      }
    };

    loadCampusLevels();
  }, []);

  const getCampusLevel = (campus: string): number => {
    const level = campusLevels[campus];
    if (level !== undefined) {
      return level;
    }
    // If campus not found, check if it's a valid campus and set default
    if (campusList.includes(campus)) {
      console.log(`Campus "${campus}" not found in levels, using default level 2`);
      return 2;
    }
    // If it's not a valid campus, use Pune as fallback
    console.log(`Invalid campus "${campus}", using Pune as fallback`);
    return campusLevels['Pune'] ?? 2;
  };

  const setCampusLevel = async (campus: string, level: number): Promise<void> => {
    const newLevels = { ...campusLevels, [campus]: level };
    setCampusLevels(newLevels);

    try {
      console.log(`Saving campus level for ${campus}: ${level}`);
      await setDoc(doc(db, 'system', 'campusLevels'), {
        levels: newLevels,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('Campus levels saved successfully:', newLevels);
    } catch (error) {
      console.error('Failed to save campus level:', error);
      // Revert on error
      setCampusLevels(campusLevels);
      throw error;
    }
  };

  return (
    <CampusContext.Provider value={{
      getCampusLevel,
      setCampusLevel,
      campusLevels,
      loading
    }}>
      {children}
    </CampusContext.Provider>
  );
};
