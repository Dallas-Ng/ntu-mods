import { NextPage } from "next"

const IndexPage: NextPage = () => (
  <div className="container text-center">
    <div className="flex justify-center align-middle items-center h-72">
      <div className="max-w-[700px]">
        <h1 className="font-bold text-6xl bg-gradient-to-l from-blue-700 to-blue-800 bg-clip-text text-transparent pb-5">
          Dabao your mods better
        </h1>

        <p>
          Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem
          cupidatat commodo. Elit sunt amet fugiat veniam occaecat fugiat
          aliqua.
        </p>
      </div>
    </div>

    <img src="https://tailwindui.com/img/component-images/project-app-screenshot.png" />
  </div>
)

export default IndexPage
