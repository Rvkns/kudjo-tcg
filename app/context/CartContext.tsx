'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type CartItemType = 'pack' | 'card' | 'product';

export interface CartItem {
  id: string;
  type: CartItemType;
  name: string;
  price: number;
  quantity: number;
  image: string;
  packTier?: string; // 'bronze' | 'silver' | 'gold' | 'platinum'
  tickets?: number; // base + bonus free tickets per item
  details?: {
    subtitle?: string;
    rarity?: string;
    condition?: string;
    setCode?: string;
    brand?: string;
  };
}

export interface CartItemInput {
  id: string;
  type: CartItemType;
  name: string;
  price: number;
  quantity?: number;
  image: string;
  packTier?: string;
  tickets?: number;
  details?: {
    subtitle?: string;
    rarity?: string;
    condition?: string;
    setCode?: string;
    brand?: string;
  };
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: CartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalPrice: number;
  totalItems: number;
  totalTickets: number;
  lastAddedItem: CartItem | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kudjo_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse saved cart items from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to LocalStorage whenever items change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart items to localStorage', e);
    }
  }, [items, isLoaded]);

  const addItem = (inputItem: CartItemInput) => {
    const qtyToAdd = inputItem.quantity && inputItem.quantity > 0 ? inputItem.quantity : 1;
    let addedOrUpdated: CartItem | null = null;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.id === inputItem.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + qtyToAdd;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        addedOrUpdated = updated[existingIndex];
        return updated;
      } else {
        const newItem: CartItem = {
          ...inputItem,
          quantity: qtyToAdd,
        };
        addedOrUpdated = newItem;
        return [...prevItems, newItem];
      }
    });

    setLastAddedItem(addedOrUpdated);
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalTickets = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.tickets || 0) * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        totalPrice,
        totalItems,
        totalTickets,
        lastAddedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
