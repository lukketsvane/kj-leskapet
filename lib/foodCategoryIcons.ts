import React from 'react'
import { 
  Apple, Beef, Carrot, CheeseIcon as Cheese, Egg, Fish, Grape, 
  IceCream2 as IceCream, Milk, Pizza, Sandwich, Utensils
} from 'lucide-react'
import type { IconProps } from 'lucide-react'

export const foodCategoryIcons = {
  'Frukt': Apple,
  'Grønnsaker': Carrot,
  'Kjøtt': Beef,
  'Fisk': Fish,
  'Meieri': Milk,
  'Egg': Egg,
  'Ost': Cheese,
  'Bakevarer': Sandwich,
  'Frossen mat': IceCream,
  'Drikke': Grape,
  'Ferdigmat': Pizza,
  'Annet': Utensils
}

export type FoodCategory = keyof typeof foodCategoryIcons;

export interface IconWrapperProps {
  icon: React.ElementType<IconProps>;
}

export const createIconWrapper = (Icon: React.ElementType<IconProps>) => {
  return {
    component: Icon,
    props: { size: 24 },
    wrapperStyle: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%'
    }
  };
};