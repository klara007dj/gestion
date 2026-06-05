import { redirect } from 'next/navigation';

// La section participant n'a pas de tableau de bord dédié :
// on redirige la racine /participant vers le catalogue des formations.
export default function ParticipantIndexPage() {
  redirect('/participant/formations');
}
