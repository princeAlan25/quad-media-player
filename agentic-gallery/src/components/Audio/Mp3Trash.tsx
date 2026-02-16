import { TrashAudiosList } from "./TrashAudiosList"

export const Mp3Trash = () => {
    return (
        <div className="w-full h-[50%] p-2">
            <p className="text-xl font-bold p-2">Trash</p>
            <TrashAudiosList />
        </div>
    );
};
