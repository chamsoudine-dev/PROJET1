export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Administrateur</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="mb-4">
          Bienvenue, administrateur national. Vous avez accès à toutes les fonctionnalités.
        </p>
        <p className="text-sm text-gray-600">
          Rôle : ADMIN_NATIONAL · Toutes régions · Toutes formations
        </p>
      </div>
    </div>
  );
}