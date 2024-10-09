import RefrigeratorApp from '@/components/refrigerator-app'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col ">
      <h1 className="sr-only">KJØLESKAPET App</h1>
      <RefrigeratorApp />
    </main>
  )
}