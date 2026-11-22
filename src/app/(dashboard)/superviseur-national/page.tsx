export default function SuperviseurNationalPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Superviseur National</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="mb-4">
          Bienvenue, superviseur national. Vous voyez toutes les régions.
        </p>
        <p className="text-sm text-gray-600">
          Rôle : SUPERVISEUR_NATIONAL · Toutes régions · Toutes formations
        </p>
      </div>
    </div>
  );
}