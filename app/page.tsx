import Image from "next/image"

import { Icons } from "@/components/icons"

export default function IndexPage() {
  return (
    <div className="container p-3">
      <div className="flex items-center justify-center align-middle md:h-72">
        <div className="max-w-[800px]">
          <div className="mb-5 flex flex-col items-center justify-center text-center md:flex-row md:text-left">
            <Icons.logo height={200} width={200} />

            <h1 className="bg-gradient-to-l from-blue-700 to-blue-800 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              Dabao your <br />
              mods better
            </h1>
          </div>

          <p className="text-center">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam
            reiciendis dolorum vitae sed nostrum officiis aspernatur. Odio quam
            repellat fugit, necessitatibus earum consequuntur placeat, nihil,
            iusto asperiores modi ipsum alias!
          </p>
        </div>
      </div>

      <div className="relative z-20 mt-5 hidden h-[700px] w-full justify-center md:block">
        <Image
          src="/product-screenshot.png"
          alt="product"
          className="object-contain"
          fill
        />
      </div>
    </div>
  )
}
