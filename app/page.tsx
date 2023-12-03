import { NextPage } from "next"

import { Icons } from "@/components/icons"

const IndexPage: NextPage = () => (
  <div className="container p-3">
    <div className="flex justify-center align-middle items-center md:h-72">
      <div className="max-w-[800px]">
        <div className="flex justify-center items-center mb-5 flex-col md:flex-row text-center md:text-left">
          <Icons.logo className="w-32 h-32" />

          <h1 className="font-bold text-5xl md:text-6xl bg-gradient-to-l from-blue-700 to-blue-800 bg-clip-text text-transparent">
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

    <div className="hidden w-full h-full rounded-xl overflow-hidden md:flex justify-center mt-5">
      <img src="/product-screenshot.png" className="w-full h-full" />
    </div>
  </div>
)

export default IndexPage
