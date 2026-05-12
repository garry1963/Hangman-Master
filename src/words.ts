export const CATEGORIES = {
  ANIMALS: [
    "ELEPHANT", "GIRAFFE", "HIPPOPOTAMUS", "KANGAROO", "PENGUIN", "RHINOCEROS", 
    "SQUIRREL", "TIGER", "ZEBRA", "CHAMELEON", "CROCODILE", "FLAMINGO", "IGUANA"
  ],
  COUNTRIES: [
    "ARGENTINA", "AUSTRALIA", "BRAZIL", "CANADA", "DENMARK", "EGYPT", "FRANCE", 
    "GERMANY", "JAPAN", "MEXICO", "SWITZERLAND", "THAILAND", "VIETNAM", "MADAGASCAR"
  ],
  MOVIES: [
    "INCEPTION", "GLADIATOR", "TITANIC", "AVATAR", "MATRIX", "JAWS", "ROCKY",
    "JURASSIC PARK", "STAR WARS", "THE GODFATHER", "FORREST GUMP", "TOY STORY"
  ],
  FOOD: [
    "SPAGHETTI", "HAMBURGER", "CROISSANT", "SUSHI", "PANCAKES", "WAFFLES", 
    "CHOCOLATE", "STRAWBERRY", "WATERMELON", "QUESADILLA", "GUACAMOLE", "MACARONI"
  ],
  TECHNOLOGY: [
    "COMPUTER", "SMARTPHONE", "INTERNET", "KEYBOARD", "SOFTWARE", "HARDWARE",
    "BLUETOOTH", "SATELLITE", "ALGORITHM", "DATABASE", "ROBOTICS", "APPLICATION"
  ]
};

export type Category = keyof typeof CATEGORIES;

export function getRandomWord(): { word: string; category: string } {
  const categories = Object.keys(CATEGORIES) as Category[];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const words = CATEGORIES[randomCategory];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  
  return { 
    word: randomWord, 
    category: randomCategory 
  };
}
