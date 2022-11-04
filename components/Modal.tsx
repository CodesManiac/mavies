import {
  AddCircle,
  CloseCircle,
  Like1,
  PlayCircle,
  VolumeHigh,
  VolumeSlash,
} from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player/lazy';
import { useRecoilState, useRecoilValue } from 'recoil';
import Swal from 'sweetalert2';
import { modalState, movieState } from '../atoms/modalAtom';
import { Genre, Movie, Element } from '../typings';

const Modal = () => {
  const [showModal, setShowModal] = useRecoilState(modalState);
  //   const [movie, setMovie] = useState<Movie | null>(null);
  const [trailer, setTrailer] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const movie = useRecoilValue(movieState);
  const [muted, setMuted] = useState(false);

  const handleClose = () => {
    setShowModal(false);
  };

  async function fetchMovie() {
    const data = await fetch(
      `https://api.themoviedb.org/3/${
        movie?.media_type === 'tv' ? 'tv' : 'movie'
      }/${movie?.id}?api_key=${
        process.env.NEXT_PUBLIC_API_KEY
      }&language=en-US&append_to_response=videos`
    )
      .then((response) => response.json())
      .catch((error) =>
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Please check your network settings',
          confirmButtonColor: '#34275d',
        })
      );

    if (data?.videos) {
      const index = data.videos.results.findIndex(
        (element: Element) => element.type === 'Trailer'
      );
      setTrailer(data.videos?.results[index]?.key);
    }
    if (data?.genres) {
      setGenres(data.genres);
    }
  }
  useEffect(() => {
    if (!movie) {
      console.log('there is no movie');
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'There is an error. Please check your network settings',
        confirmButtonColor: '#34275d',
      });
    }

    fetchMovie();
  }, [movie]);
  console.log('trailer is', trailer);
  return (
    <div className='fixed left-0 right-0 w-full max-w-5xl mx-auto top-10 z-40'>
      <div className='p-6 bg-dark text-white z-40 rounded-lg'>
        <div className='absolute right-5 top-5 z-50 cursor-pointer'>
          <CloseCircle size='32' color='#ffffff' onClick={handleClose} />
        </div>
        <div className='relative pt-[56.25%]'>
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${trailer}`}
            width='100%'
            height='100%'
            style={{ position: 'absolute', top: '0', left: '0' }}
            playing
            muted={muted}
          />
        </div>
        <div className='flex gap-4 items-center mt-2'>
          <button className='modal-button flex gap-x-2 bg-primary px-5 py-1.5 rounded-lg'>
            <PlayCircle size='24' color='#ffffff' /> Play
          </button>{' '}
          <Like1 size='32' color='#ffffff' className='modal-button' />
          <AddCircle size='32' color='#ffffff' className='modal-button' />
          <button className='modal-button' onClick={() => setMuted(!muted)}>
            {muted ? (
              <VolumeSlash size='32' color='#ffffff' />
            ) : (
              <VolumeHigh size='32' color='#ffffff' />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
