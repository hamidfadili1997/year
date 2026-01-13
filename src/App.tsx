import React, { useState, useEffect } from 'react';
import './App.css'
import { Header } from './components/Header';
import { LegendControls } from './components/LegendControls';
import { CalendarGrid } from './components/CalendarGrid';
import { Legend } from './components/Legend';
import { AddLabelModal } from './components/AddLabelModal';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('calendar_theme') as 'dark' | 'light') || 'light';
  });
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

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeDate, setActiveDate] = useState<{ monthIndex: number, day: number } | null>(null);

  const handleRightClick = (e: React.MouseEvent, monthIndex: number, day: number) => {
    e.preventDefault(); // Prevent default browser context menu
    setActiveDate({ monthIndex, day });
    setShowModal(true);
  };

  const handleSaveModal = (name: string, color: string, existingId?: string) => {
    if (!activeDate) return;

    let idToAssign = existingId;

    if (!idToAssign) {
      if (!name) return; // Name required for new category
      const newCategory = {
        id: crypto.randomUUID(),
        name,
        color,
      };
      setCategories([...categories, newCategory]);
      idToAssign = newCategory.id;
    }

    if (idToAssign) {
      const key = `${activeDate.monthIndex}-${activeDate.day}`;
      setDayAssignments(prev => {
        const existing = prev[key] || [];
        if (existing.includes(idToAssign!)) return prev;
        return {
          ...prev,
          [key]: [...existing, idToAssign!]
        };
      });
    }

    setShowModal(false);
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
      <AddLabelModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveModal}
        categories={categories}
      />

      <Header year={year} theme={theme} toggleTheme={toggleTheme} />

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
        onDayContextMenu={handleRightClick}
      />

      <Legend categories={categories} />
    </div>
  )
}

export default App
