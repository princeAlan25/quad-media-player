import { Mp3Player } from '@/widgets/audio-player'

export const AudioPage = () => {
  return (
    <div className="w-full h-full flex justify-between overflow-x-auto bg-white text-red">
      <Mp3Player />
    </div>
  )
}

