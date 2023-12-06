import { NextPage } from "next"

import { Icons } from "@/components/icons"

const IndexPage: NextPage = () => (
  <div className="container p-3">
    <div className="flex items-center justify-center align-middle md:h-72">
      <div className="max-w-[800px]">
        <div className="mb-5 flex flex-col items-center justify-center text-center md:flex-row md:text-left">
          <Icons.logo className="h-32 w-32" />

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

    <div className="mt-5 hidden h-full w-full justify-center overflow-hidden rounded-xl md:flex">
      <img src="/product-screenshot.png" className="h-full w-full" />
    </div>
  </div>
)

export default IndexPage
