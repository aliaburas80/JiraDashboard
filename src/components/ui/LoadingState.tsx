import Preloader from './Preloader';

export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return <Preloader message={message} />;
}
