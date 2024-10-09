import { Card, CardContent } from "@/components/ui/card"

interface FoodItemProps {
  name: string
  category: string
  quantity: string
  unit: string
}

export default function FoodItemCard({ name, category, quantity, unit }: FoodItemProps) {
  return (
    <Card className="w-full h-full">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div>
          <h3 className="text-lg font-semibold mb-1">{name}</h3>
          <p className="text-sm text-gray-500">{category}</p>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium">
            {quantity} {unit}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}