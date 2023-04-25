import Image from 'next/image'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Product() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-white">
      <h2>PRODUCT PAGE</h2>
    </main>
  )
}
