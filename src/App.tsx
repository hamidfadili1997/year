import { useState, useEffect } from 'react';
import './App.css'
import { Header } from './components/Header';
import { LegendControls } from './components/LegendControls';
import { CalendarGrid } from './components/CalendarGrid';
import { Legend } from './components/Legend';
import { DaySheet } from './components/DaySheet';
import { useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('calendar_theme') as 'dark' | 'light') || 'light';
  });
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const year = 2026;

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('calendar_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>(() => {
    const saved = localStorage.getItem('calendar_categories');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('calendar_categories', JSON.stringify(categories));
  }, [categories]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [dayAssignments, setDayAssignments] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('calendar_assignments');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old string values to arrays if necessary
      const migrated: Record<string, string[]> = {};
      Object.keys(parsed).forEach(key => {
        migrated[key] = Array.isArray(parsed[key]) ? parsed[key] : [parsed[key]];
      });
      return migrated;
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('calendar_assignments', JSON.stringify(dayAssignments));
  }, [dayAssignments]);

  const handleCloudSave = async () => {
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'Not Logged In',
        text: 'Please login to save your data to the cloud.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        categories,
        dayAssignments,
        lastUpdated: new Date().toISOString()
      });
      Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Your calendar has been saved to the cloud.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error saving to cloud:", error);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'There was an error saving your data. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadCloudData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.categories) setCategories(data.categories);
            if (data.dayAssignments) setDayAssignments(data.dayAssignments);
          }
        } catch (error) {
          console.error("Error loading cloud data:", error);
        }
      }
    };
    loadCloudData();
  }, [user]);

  const addCategory = (name: string, color: string) => {
    const newCategory = {
      id: crypto.randomUUID(),
      name,
      color,
    };
    setCategories([...categories, newCategory]);
    // Auto-select the new category
    setSelectedCategoryId(newCategory.id);
  };

  const handleDayClick = (monthIndex: number, day: number) => {
    const key = `${monthIndex}-${day}`;
    const currentCategoryIds = dayAssignments[key] || [];

    // 1. Eraser mode (no category selected) - Clear ALL
    if (!selectedCategoryId) {
      if (currentCategoryIds.length > 0) {
        setDayAssignments(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
      return;
    }

    // 2. Toggling selection
    setDayAssignments(prev => {
      const existing = prev[key] || [];
      if (existing.includes(selectedCategoryId)) {
        // Remove this specific category
        const updated = existing.filter(id => id !== selectedCategoryId);
        const next = { ...prev };
        if (updated.length === 0) {
          delete next[key];
        } else {
          next[key] = updated;
        }
        return next;
      } else {
        // Add this specific category
        return {
          ...prev,
          [key]: [...existing, selectedCategoryId]
        };
      }
    });
  };

  // Day detail sheet state
  const [showSheet, setShowSheet] = useState(false);
  const [activeDate, setActiveDate] = useState<{ monthIndex: number, day: number } | null>(null);
  const activeKey = activeDate ? `${activeDate.monthIndex}-${activeDate.day}` : null;

  const handleDayInspect = (monthIndex: number, day: number) => {
    setActiveDate({ monthIndex, day });
    setShowSheet(true);
  };

  const assignToActiveDay = (categoryId: string) => {
    if (!activeKey) return;
    setDayAssignments(prev => {
      const existing = prev[activeKey] || [];
      if (existing.includes(categoryId)) return prev;
      return { ...prev, [activeKey]: [...existing, categoryId] };
    });
  };

  const handleSheetCreate = (name: string, color: string) => {
    const newCategory = { id: crypto.randomUUID(), name, color };
    setCategories(prev => [...prev, newCategory]);
    assignToActiveDay(newCategory.id);
  };

  const handleSheetRemove = (categoryId: string) => {
    if (!activeKey) return;
    setDayAssignments(prev => {
      const existing = prev[activeKey] || [];
      const updated = existing.filter(id => id !== categoryId);
      const next = { ...prev };
      if (updated.length === 0) {
        delete next[activeKey];
      } else {
        next[activeKey] = updated;
      }
      return next;
    });
  };

  const handleSheetClearAll = () => {
    if (!activeKey) return;
    setDayAssignments(prev => {
      const next = { ...prev };
      delete next[activeKey];
      return next;
    });
  };

  const removeCategory = (id: string) => {
    // 1. Remove from categories list
    setCategories(prev => prev.filter(c => c.id !== id));

    // 2. Clear all day assignments using this category
    setDayAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key].includes(id)) {
          next[key] = next[key].filter(catId => catId !== id);
          if (next[key].length === 0) {
            delete next[key];
          }
        }
      });
      return next;
    });

    // 3. Deselect if it was selected
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    }
  };

  return (
    <div className="calendar-container">
      {showSheet && activeDate && activeKey && (
        <DaySheet
          key={activeKey}
          year={year}
          date={activeDate}
          categories={categories}
          assignedIds={dayAssignments[activeKey] || []}
          onClose={() => setShowSheet(false)}
          onAddExisting={assignToActiveDay}
          onCreate={handleSheetCreate}
          onRemove={handleSheetRemove}
          onClearAll={handleSheetClearAll}
        />
      )}

      <Header
        year={year}
        theme={theme}
        toggleTheme={toggleTheme}
        onCloudSave={handleCloudSave}
        isSaving={isSaving}
      />

      <LegendControls
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onAddCategory={addCategory}
        onRemoveCategory={removeCategory}
      />

      <CalendarGrid
        year={year}
        categories={categories}
        dayAssignments={dayAssignments}
        onDayClick={handleDayClick}
        onDayInspect={handleDayInspect}
      />

      <Legend categories={categories} />
    </div>
  )
}

export default App
