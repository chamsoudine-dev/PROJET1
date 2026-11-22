export default function AgentPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Agent de Santé</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="mb-4">
          Bienvenue, agent de santé. Vous voyez seulement vos formations.
        </p>
        <p className="text-sm text-gray-600">
          Rôle : AGENT_SANTE · Voir seulement votre formation · Vos patients
        </p>
      </div>
    </div>
  );
}