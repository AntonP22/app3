// Nutrition Tracking App (Frontend Only - React + TailwindCSS)
// Stores Excel data in localStorage for persistence

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './components/ui/card';
import * as XLSX from 'xlsx';

export default function NutritionApp() {
  const [menuData, setMenuData] = useState([]);
  const [recipesData, setRecipesData] = useState([]);
  const [dessertsData, setDessertsData] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [recipeMap, setRecipeMap] = useState({});
  const [completedMeals, setCompletedMeals] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('completedMeals') || '{}');
    }
    return {};
  });
  const [activeTab, setActiveTab] = useState('menu');
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('completedMeals', JSON.stringify(completedMeals));
  }, [completedMeals]);

  useEffect(() => {
    const storedData = localStorage.getItem('excelNutritionData');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setMenuData(parsed.menuData);
      setRecipesData(parsed.recipesData);
      setDessertsData(parsed.dessertsData);
      setShoppingList(parsed.shoppingList);
      setRecipeMap(parsed.recipeMap);
    }
  }, []);

  const toggleMealCompleted = (dish) => {
    setCompletedMeals((prev) => ({
      ...prev,
      [dish]: !prev[dish]
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const menuSheet = workbook.Sheets['Меню на неделю (v4)'];
      const menuJson = XLSX.utils.sheet_to_json(menuSheet, { header: 1 });
      const menu = [];
      const recipeSheet = workbook.Sheets['Быстрые рецепты'];
      const links = {};

      for (let i = 1; i < menuJson.length; i++) {
        const row = menuJson[i];
        if (!row || row.length < 4) continue;
        const dishName = row[3];
        const cellRef = 'D' + (i + 1);
        const cell = menuSheet[cellRef];

        if (cell?.l?.Target?.includes("'Быстрые рецепты'!")) {
          const address = cell.l.Target.split("!")[1];
          const recipeCell = recipeSheet[address];
          const linkedRecipeName = recipeCell?.v?.toString().toLowerCase().trim();
          if (linkedRecipeName && dishName) {
            links[dishName.toLowerCase().trim()] = linkedRecipeName;
          }
        }

        menu.push({
          'День': row[0],
          'Время приёма пищи': row[1],
          'Приём пищи': row[2],
          'Блюдо / Рецепт': dishName
        });
      }

      const recipes = XLSX.utils.sheet_to_json(recipeSheet);
      const desserts = XLSX.utils.sheet_to_json(workbook.Sheets['ПП-десерты']);
      const shopping = XLSX.utils.sheet_to_json(workbook.Sheets['Список покупок (v4)']);

      setMenuData(menu);
      setRecipeMap(links);
      setRecipesData(recipes);
      setDessertsData(desserts);
      setShoppingList(shopping);

      localStorage.setItem(
        'excelNutritionData',
        JSON.stringify({ menuData: menu, recipesData: recipes, dessertsData: desserts, shoppingList: shopping, recipeMap: links })
      );
    };

    reader.readAsArrayBuffer(file);
  };

  const openRecipeModal = (dishName) => {
    console.log("Modal click triggered for:", dishName); // Проверка, что функция сработала
    const normalized = dishName?.toLowerCase().trim();
    const linkedName = recipeMap[normalized];

    let found = null;
    if (linkedName) {
      found = recipesData.find(r => r['Блюдо']?.toLowerCase().trim() === linkedName);
    }

    if (!found) {
      found = recipesData.find(r => r['Блюдо']?.toLowerCase().includes(normalized));
    }

    if (found) {
      console.log("Found recipe:", found); // Проверка, что рецепт найден
    } else {
      console.log("Recipe not found for:", dishName); // Лог для отслеживания отсутствующих рецептов
    }

    setSelectedDish(dishName);
    setSelectedRecipe(found || null);

    if (found) {
      setIsModalOpen(true);  // Открытие модального окна, если рецепт найден
    } else {
      console.log("No recipe linked to this dish.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDish(null);
    setSelectedRecipe(null);
    console.log("Modal closed"); // Лог при закрытии модального окна
  };

  const tabs = [
    { id: 'menu', label: 'Menu' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'desserts', label: 'Desserts' },
    { id: 'shopping', label: 'Shopping List' }
  ];

  return (
    <div className={`p-4 max-w-7xl mx-auto ${isModalOpen ? 'overflow-hidden h-screen' : ''}`}>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center sm:text-left">Nutrition Tracker</h1>

      <input type="file" accept=".xlsx" onChange={handleFileUpload} className="mb-6 w-full sm:w-auto" />

      <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); closeModal(); }}
            className={`px-4 py-2 rounded-xl font-medium ${activeTab === tab.id ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'menu' && (
        <div>
          {menuData.map((row, index) => {
            const dish = row['Блюдо / Рецепт'];
            const isChecked = !!completedMeals[dish];

            return (
              <div key={index} className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleMealCompleted(dish)}
                  className="w-5 h-5"
                />
                <Card
                  className="cursor-pointer hover:bg-gray-100 transition w-full"
                  onClick={() => openRecipeModal(dish)}
                >
                  <CardContent>
                    <p className={`${isChecked ? 'line-through text-gray-500' : ''}`}>
                      <strong>{row['День'] || ''}</strong> — {row['Время приёма пищи']}: {dish}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'recipes' && (
        <div>
          {recipesData.map((row, index) => (
            <Card key={index} className="mb-2">
              <CardContent>
                <p className="font-semibold">{row['Блюдо']}</p>
                <p>{row['Состав (в сыром виде)']}</p>
                <p className="italic text-sm mt-1">{row['Приготовление']}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'desserts' && (
        <div>
          {dessertsData.map((row, index) => (
            <Card key={index} className="mb-2">
              <CardContent>
                <p className="font-semibold">{row['Название']}</p>
                <p>{row['Ингредиенты']}</p>
                <p className="italic text-sm mt-1">{row['Приготовление']}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'shopping' && (
        <div>
          {shoppingList.map((row, index) => {
            const item = row['Продукт'];
            const qty = row['Количество'];
            const checked = completedMeals[item];

            return (
              <div key={index} className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!checked}
                  onChange={() => toggleMealCompleted(item)}
                  className="w-5 h-5"
                />
                <Card className="w-full">
                  <CardContent>
                    <p className={`${checked ? 'line-through text-gray-500' : ''}`}>{item}: <strong>{qty}</strong></p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white p-6 rounded-xl max-w-xl w-full relative overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute top-2 right-3 text-xl font-bold">×</button>
            {selectedRecipe ? (
              <>
                <h2 className="text-2xl font-semibold mb-4">{selectedRecipe['Блюдо']}</h2>
                <p><strong>Ингредиенты:</strong> {selectedRecipe['Состав (в сыром виде)']}</p>
                <p className="mt-2"><strong>Приготовление:</strong> {selectedRecipe['Приготовление']}</p>
              </>
            ) : (
              <p className="text-red-600">Рецепт не найден для: {selectedDish}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
