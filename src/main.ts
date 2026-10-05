import '@fontsource/andika/400.css';
import '@fontsource/andika/700.css';
import './style.css';
import type { Profile } from './core/profile';
import { root } from './ui/app';
import { showGame } from './ui/screens/game';
import { showHome } from './ui/screens/home';
import { showPlacement } from './ui/screens/placement';
import { showTherapist } from './ui/screens/therapist';
import { prepareVoice } from './ui/speech';

function home(): void {
  showHome(root, { open, therapist: () => showTherapist(root, home) });
}

function open(p: Profile): void {
  if (!p.placementDone || !p.game) showPlacement(root, p, () => open(p));
  else showGame(root, p, home);
}

home();
// la voix neuronale se télécharge en arrière-plan dès l'ouverture
prepareVoice();
