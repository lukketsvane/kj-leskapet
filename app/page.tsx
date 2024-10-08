import RefrigeratorApp from '@/components/refrigerator-app'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24">
      <h1 className="sr-only">KJØLESKAPET App</h1>
      <RefrigeratorApp />
    </main>
  )
}