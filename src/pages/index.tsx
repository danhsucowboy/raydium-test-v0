import type { NextPage } from 'next'
import { Repeat } from 'react-feather'

const Home: NextPage = (props) => {
  return (
    <div className="flex justify-center items-start mt-28 w-full h-full">
      <div className="w-1/4 h-1/2 bg-stone-500 rounded-2xl flex flex-col justify-center items-center gap-8">
        <div id="up" className="w-2/3 flex justify-between items-center">
          <label className="mr-4 text-2xl">SOL</label>
          <input type="number" className="border-2 border-slate-200 rounded-md h-12 text-black" />
        </div>
        <Repeat />
        <div id="down" className="w-2/3 flex justify-between items-center">
          <label className="mr-4 text-2xl">RAY</label>
          <input type="number" className="border-2 border-slate-200 rounded-md h-12 text-black" />
        </div>
        <button className="w-2/3 h-10 mt-4 border-2 border-blue-500 bg-blue-500 rounded-md">SWAP</button>
      </div>
    </div>
  )
}

export default Home
