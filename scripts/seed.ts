import { db } from '../src/lib/db';
import {
  region,
  district,
  formationSanitaire,
  typeFormationEnum,
  maladieDeclarationObligatoire,
  utilisateur,
} from '../src/lib/db/schema';
import { hashPassword } from '../src/lib/utils/crypto';

async function seed() {
  console.log('🌱 Début du seed de la base de données...');

  // 1. Régions du Niger (8 régions)
  console.log('📍 Insertion des 8 régions...');
  const regionsData = [
    { code: 'AG', nom: 'Agadez', nomHaoussa: 'Agadez', nomZarma: 'Agadez' },
    { code: 'DI', nom: 'Diffa', nomHaoussa: 'Diffa', nomZarma: 'Diffa' },
    { code: 'DO', nom: 'Dosso', nomHaoussa: 'Dosso', nomZarma: 'Doso' },
    { code: 'MA', nom: 'Maradi', nomHaoussa: 'Maradi', nomZarma: 'Maradi' },
    { code: 'NI', nom: 'Niamey', nomHaoussa: 'Niamey', nomZarma: 'Niamey' },
    { code: 'TA', nom: 'Tahoua', nomHaoussa: 'Tahoua', nomZarma: 'Tahoua' },
    { code: 'TI', nom: 'Tillabéri', nomHaoussa: 'Tilaberi', nomZarma: 'Tillabéri' },
    { code: 'ZI', nom: 'Zinder', nomHaoussa: 'Zinder', nomZarma: 'Zinder' },
  ];

  for (const r of regionsData) {
    await db.insert(region).values(r).onConflictDoNothing({ target: region.code });
  }
  console.log('✅ Régions insérées');

  // 2. Districts sanitaires (échantillon représentatif par région)
  console.log('🏥 Insertion des districts sanitaires...');
  const districtsData = [
    // Agadez
    { regionCode: 'AG', code: 'AGADEZ', nom: 'Agadez', nomHaoussa: 'Agadez', nomZarma: 'Agadez' },
    { regionCode: 'AG', code: 'ARLIT', nom: 'Arlit', nomHaoussa: 'Arlit', nomZarma: 'Arlit' },
    { regionCode: 'AG', code: 'BILMA', nom: 'Bilma', nomHaoussa: 'Bilma', nomZarma: 'Bilma' },
    { regionCode: 'AG', code: 'TCHIROZERINE', nom: 'Tchirozérine', nomHaoussa: 'Tchirozérine', nomZarma: 'Tchirozérine' },

    // Diffa
    { regionCode: 'DI', code: 'DIFFA', nom: 'Diffa', nomHaoussa: 'Diffa', nomZarma: 'Diffa' },
    { regionCode: 'DI', code: 'MAINE_SOROA', nom: 'Maïné-Soroa', nomHaoussa: 'Maine-Soroa', nomZarma: 'Maïné-Soroa' },
    { regionCode: 'DI', code: 'NGOURTI', nom: 'N\'Guigmi', nomHaoussa: 'Ngourti', nomZarma: 'N\'Guigmi' },

    // Dosso
    { regionCode: 'DO', code: 'DOSSO', nom: 'Dosso', nomHaoussa: 'Dosso', nomZarma: 'Doso' },
    { regionCode: 'DO', code: 'BOBNOYE', nom: 'Boboye', nomHaoussa: 'Boboye', nomZarma: 'Boboye' },
    { regionCode: 'DO', code: 'DOGONDOUTCHI', nom: 'Dogon-Doutchi', nomHaoussa: 'Dogon-Doutchi', nomZarma: 'Dogon-Doutchi' },
    { regionCode: 'DO', code: 'Gaya', nom: 'Gaya', nomHaoussa: 'Gaya', nomZarma: 'Gaya' },
    { regionCode: 'DO', code: 'LOGA', nom: 'Loga', nomHaoussa: 'Loga', nomZarma: 'Loga' },

    // Maradi
    { regionCode: 'MA', code: 'MARADI', nom: 'Maradi', nomHaoussa: 'Maradi', nomZarma: 'Maradi' },
    { regionCode: 'MA', code: 'DAN_ISSA', nom: 'Dan Issa', nomHaoussa: 'Dan Issa', nomZarma: 'Dan Issa' },
    { regionCode: 'MA', code: 'GUIDAN_ROUMDJI', nom: 'Guidan Roumdji', nomHaoussa: 'Guidan Roumdji', nomZarma: 'Guidan Roumdji' },
    { regionCode: 'MA', code: 'MADAROUNFA', nom: 'Madarounfa', nomHaoussa: 'Madarounfa', nomZarma: 'Madarounfa' },
    { regionCode: 'MA', code: 'MAYAH', nom: 'Mayahi', nomHaoussa: 'Mayahi', nomZarma: 'Mayahi' },
    { regionCode: 'MA', code: 'TESKER', nom: 'Tessaoua', nomHaoussa: 'Tessaoua', nomZarma: 'Tessaoua' },

    // Niamey (communes urbaines comme districts)
    { regionCode: 'NI', code: 'COMMUNE_I', nom: 'Commune I', nomHaoussa: 'Gida I', nomZarma: 'Kombo I' },
    { regionCode: 'NI', code: 'COMMUNE_II', nom: 'Commune II', nomHaoussa: 'Gida II', nomZarma: 'Kombo II' },
    { regionCode: 'NI', code: 'COMMUNE_III', nom: 'Commune III', nomHaoussa: 'Gida III', nomZarma: 'Kombo III' },
    { regionCode: 'NI', code: 'COMMUNE_IV', nom: 'Commune IV', nomHaoussa: 'Gida IV', nomZarma: 'Kombo IV' },
    { regionCode: 'NI', code: 'COMMUNE_V', nom: 'Commune V', nomHaoussa: 'Gida V', nomZarma: 'Kombo V' },

    // Tahoua
    { regionCode: 'TA', code: 'TAHOUA', nom: 'Tahoua', nomHaoussa: 'Tahoua', nomZarma: 'Tahoua' },
    { regionCode: 'TA', code: 'ABALAK', nom: 'Abalak', nomHaoussa: 'Abalak', nomZarma: 'Abalak' },
    { regionCode: 'TA', code: 'BIRNI_NKONNI', nom: 'Birni-N\'Konni', nomHaoussa: 'Birni-Nkonni', nomZarma: 'Birni-N\'Konni' },
    { regionCode: 'TA', code: 'BOUZA', nom: 'Bouza', nomHaoussa: 'Bouza', nomZarma: 'Bouza' },
    { regionCode: 'TA', code: 'ILLELA', nom: 'Illéla', nomHaoussa: 'Ilela', nomZarma: 'Illéla' },
    { regionCode: 'TA', code: 'KEITA', nom: 'Keita', nomHaoussa: 'Keita', nomZarma: 'Keita' },
    { regionCode: 'TA', code: 'MADAOUA', nom: 'Madaoua', nomHaoussa: 'Madaoua', nomZarma: 'Madaoua' },
    { regionCode: 'TA', code: 'TCHINTABARADEN', nom: 'Tchintabaraden', nomHaoussa: 'Tchintabaraden', nomZarma: 'Tchintabaraden' },

    // Tillabéri
    { regionCode: 'TI', code: 'TILLABERI', nom: 'Tillabéri', nomHaoussa: 'Tilaberi', nomZarma: 'Tillabéri' },
    { regionCode: 'TI', code: 'AYEROU', nom: 'Ayerou', nomHaoussa: 'Ayerou', nomZarma: 'Ayerou' },
    { regionCode: 'TI', code: 'BANKILARE', nom: 'Bankilaré', nomHaoussa: 'Bankilare', nomZarma: 'Bankilare' },
    { regionCode: 'TI', code: 'FILINGUE', nom: 'Filingué', nomHaoussa: 'Filingue', nomZarma: 'Filingué' },
    { regionCode: 'TI', code: 'KOLLO', nom: 'Kollo', nomHaoussa: 'Kollo', nomZarma: 'Kollo' },
    { regionCode: 'TI', code: 'OUALAM', nom: 'Ouallam', nomHaoussa: 'Ouallam', nomZarma: 'Ouallam' },
    { regionCode: 'TI', code: 'SAY', nom: 'Say', nomHaoussa: 'Say', nomZarma: 'Say' },
    { regionCode: 'TI', code: 'TORODI', nom: 'Torodi', nomHaoussa: 'Torodi', nomZarma: 'Torodi' },

    // Zinder
    { regionCode: 'ZI', code: 'ZINDER', nom: 'Zinder', nomHaoussa: 'Zinder', nomZarma: 'Zinder' },
    { regionCode: 'ZI', code: 'DAMAGARAM_TAKAYA', nom: 'Damagaram Takaya', nomHaoussa: 'Damagaram Takaya', nomZarma: 'Damagaram Takaya' },
    { regionCode: 'ZI', code: 'GOURÉ', nom: 'Gouré', nomHaoussa: 'Goure', nomZarma: 'Gouré' },
    { regionCode: 'ZI', code: 'MAGARIA', nom: 'Magaria', nomHaoussa: 'Magaria', nomZarma: 'Magaria' },
    { regionCode: 'ZI', code: 'MIRRIAH', nom: 'Mirriah', nomHaoussa: 'Mirriah', nomZarma: 'Mirriah' },
    { regionCode: 'ZI', code: 'TANOUT', nom: 'Tanout', nomHaoussa: 'Tanout', nomZarma: 'Tanout' },
  ];

  const regions = await db.select().from(region);
  const regionMap = new Map(regions.map(r => [r.code, r.id]));

  for (const d of districtsData) {
    const regionId = regionMap.get(d.regionCode);
    if (regionId) {
      await db.insert(district).values({
        regionId,
        code: d.code,
        nom: d.nom,
        nomHaoussa: d.nomHaoussa,
        nomZarma: d.nomZarma,
      }).onConflictDoNothing({ target: [district.regionId, district.code] });
    }
  }
  console.log('✅ Districts insérés');

  // 3. Formations sanitaires (échantillon par district)
  console.log('🏥 Insertion des formations sanitaires (échantillon)...');
  const districts = await db.select().from(district);
  const districtMap = new Map(districts.map(d => [`${d.regionId}-${d.code}`, d.id]));

  // Quelques formations représentatives par district
  const formationsData: Array<{
    districtRegionCode: string;
    districtCode: string;
    code: string;
    nom: string;
    type: (typeof typeFormationEnum.enumValues)[number];
  }> = [
    // Agadez
    { districtRegionCode: 'AG', districtCode: 'AGADEZ', code: 'CSI-AGADEZ-001', nom: 'CSI Agadez Centre', type: 'CSI' },
    { districtRegionCode: 'AG', districtCode: 'AGADEZ', code: 'HOP-REG-AGADEZ', nom: 'Hôpital Régional d\'Agadez', type: 'HOPITAL_REGIONAL' },
    { districtRegionCode: 'AG', districtCode: 'ARLIT', code: 'CSI-ARLIT-001', nom: 'CSI Arlit', type: 'CSI' },
    { districtRegionCode: 'AG', districtCode: 'ARLIT', code: 'HOP-DIST-ARLIT', nom: 'Hôpital de District d\'Arlit', type: 'HOPITAL_DISTRICT' },
    { districtRegionCode: 'AG', districtCode: 'BILMA', code: 'CSI-BILMA-001', nom: 'CSI Bilma', type: 'CSI' },
    { districtRegionCode: 'AG', districtCode: 'TCHIROZERINE', code: 'CSI-TCHIRO-001', nom: 'CSI Tchirozérine', type: 'CSI' },

    // Diffa
    { districtRegionCode: 'DI', districtCode: 'DIFFA', code: 'CSI-DIFFA-001', nom: 'CSI Diffa Centre', type: 'CSI' },
    { districtRegionCode: 'DI', districtCode: 'DIFFA', code: 'HOP-REG-DIFFA', nom: 'Hôpital Régional de Diffa', type: 'HOPITAL_REGIONAL' },
    { districtRegionCode: 'DI', districtCode: 'MAINE_SOROA', code: 'CSI-MAINE-001', nom: 'CSI Maïné-Soroa', type: 'CSI' },
    { districtRegionCode: 'DI', districtCode: 'NGOURTI', code: 'CSI-NGOURTI-001', nom: 'CSI N\'Guigmi', type: 'CSI' },

    // Dosso
    { districtRegionCode: 'DO', districtCode: 'DOSSO', code: 'CSI-DOSSO-001', nom: 'CSI Dosso Centre', type: 'CSI' },
    { districtRegionCode: 'DO', districtCode: 'DOSSO', code: 'HOP-REG-DOSSO', nom: 'Hôpital Régional de Dosso', type: 'HOPITAL_REGIONAL' },
    { districtRegionCode: 'DO', districtCode: 'BOBNOYE', code: 'CSI-BOBNOYE-001', nom: 'CSI Boboye', type: 'CSI' },
    { districtRegionCode: 'DO', districtCode: 'DOGONDOUTCHI', code: 'CSI-DOGON-001', nom: 'CSI Dogon-Doutchi', type: 'CSI' },
    { districtRegionCode: 'DO', districtCode: 'GAYA', code: 'CSI-GAYA-001', nom: 'CSI Gaya', type: 'CSI' },
    { districtRegionCode: 'DO', districtCode: 'LOGA', code: 'CSI-LOGA-001', nom: 'CSI Loga', type: 'CSI' },

    // Maradi
    { districtRegionCode: 'MA', districtCode: 'MARADI', code: 'CSI-MARADI-001', nom: 'CSI Maradi Centre', type: 'CSI' },
    { districtRegionCode: 'MA', districtCode: 'MARADI', code: 'HOP-REG-MARADI', nom: 'Hôpital Régional de Maradi', type: 'HOPITAL_REGIONAL' },
    { districtRegionCode: 'MA', districtCode: 'DAN_ISSA', code: 'CSI-DAN-ISSA-001', nom: 'CSI Dan Issa', type: 'CSI' },
    { districtRegionCode: 'MA', districtCode: 'GUIDAN_ROUMDJI', code: 'CSI-GUIDAN-001', nom: 'CSI Guidan Roumdji', type: 'CSI' },
    { districtRegionCode: 'MA', districtCode: 'MADAROUNFA', code: 'CSI-MADAROUNFA-001', nom: 'CSI Madarounfa', type: 'CSI' },
    { districtRegionCode: 'MA', districtCode: 'MAYAH', code: 'CSI-MAYAHI-001', nom: 'CSI Mayahi', type: 'CSI' },
    { districtRegionCode: 'MA', districtCode: 'TESKER', code: 'CSI-TESSAOUA-001', nom: 'CSI Tessaoua', type: 'CSI' },

    // Niamey
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_I', code: 'CSI-NIAMEY1-001', nom: 'CSI Niamey Commune I', type: 'CSI' },
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_I', code: 'HOP-NAT-LAMORDE', nom: 'Hôpital National de Lamordé', type: 'HOPITAL_NATIONAL' },
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_II', code: 'CSI-NIAMEY2-001', nom: 'CSI Niamey Commune II', type: 'CSI' },
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_II', code: 'HOP-NAT-YANTALA', nom: 'Hôpital National de Yantala', type: 'HOPITAL_NATIONAL' },
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_III', code: 'CSI-NIAMEY3-001', nom: 'CSI Niamey Commune III', type: 'CSI' },
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_IV', code: 'CSI-NIAMEY4-001', nom: 'CSI Niamey Commune IV', type: 'CSI' },
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_V', code: 'CSI-NIAMEY5-001', nom: 'CSI Niamey Commune V', type: 'CSI' },
    { districtRegionCode: 'NI', districtCode: 'COMMUNE_V', code: 'HOP-NAT-ZINDER', nom: 'Hôpital National de Zinder', type: 'HOPITAL_NATIONAL' },

    // Tahoua
    { districtRegionCode: 'TA', districtCode: 'TAHOUA', code: 'CSI-TAHOUA-001', nom: 'CSI Tahoua Centre', type: 'CSI' },
    { districtRegionCode: 'TA', districtCode: 'TAHOUA', code: 'HOP-REG-TAHOUA', nom: 'Hôpital Régional de Tahoua', type: 'HOPITAL_REGIONAL' },
    { districtRegionCode: 'TA', districtCode: 'ABALAK', code: 'CSI-ABALAK-001', nom: 'CSI Abalak', type: 'CSI' },
    { districtRegionCode: 'TA', districtCode: 'BIRNI_NKONNI', code: 'CSI-BIRNI-001', nom: 'CSI Birni-N\'Konni', type: 'CSI' },
    { districtRegionCode: 'TA', districtCode: 'BOUZA', code: 'CSI-BOUZA-001', nom: 'CSI Bouza', type: 'CSI' },
    { districtRegionCode: 'TA', districtCode: 'ILLELA', code: 'CSI-ILLELA-001', nom: 'CSI Illéla', type: 'CSI' },
    { districtRegionCode: 'TA', districtCode: 'KEITA', code: 'CSI-KEITA-001', nom: 'CSI Keita', type: 'CSI' },
    { districtRegionCode: 'TA', districtCode: 'MADAOUA', code: 'CSI-MADAOUA-001', nom: 'CSI Madaoua', type: 'CSI' },
    { districtRegionCode: 'TA', districtCode: 'TCHINTABARADEN', code: 'CSI-TCHINTA-001', nom: 'CSI Tchintabaraden', type: 'CSI' },

    // Tillabéri
    { districtRegionCode: 'TI', districtCode: 'TILLABERI', code: 'CSI-TILLABERI-001', nom: 'CSI Tillabéri Centre', type: 'CSI' },
    { districtRegionCode: 'TI', districtCode: 'TILLABERI', code: 'HOP-REG-TILLABERI', nom: 'Hôpital Régional de Tillabéri', type: 'HOPITAL_REGIONAL' },
    { districtRegionCode: 'TI', districtCode: 'AYEROU', code: 'CSI-AYEROU-001', nom: 'CSI Ayerou', type: 'CSI' },
    { districtRegionCode: 'TI', districtCode: 'FILINGUE', code: 'CSI-FILINGUE-001', nom: 'CSI Filingué', type: 'CSI' },
    { districtRegionCode: 'TI', districtCode: 'KOLLO', code: 'CSI-KOLLO-001', nom: 'CSI Kollo', type: 'CSI' },
    { districtRegionCode: 'TI', districtCode: 'OUALAM', code: 'CSI-OUALAM-001', nom: 'CSI Ouallam', type: 'CSI' },
    { districtRegionCode: 'TI', districtCode: 'SAY', code: 'CSI-SAY-001', nom: 'CSI Say', type: 'CSI' },
    { districtRegionCode: 'TI', districtCode: 'TORODI', code: 'CSI-TORODI-001', nom: 'CSI Torodi', type: 'CSI' },

    // Zinder
    { districtRegionCode: 'ZI', districtCode: 'ZINDER', code: 'CSI-ZINDER-001', nom: 'CSI Zinder Centre', type: 'CSI' },
    { districtRegionCode: 'ZI', districtCode: 'ZINDER', code: 'HOP-REG-ZINDER', nom: 'Hôpital Régional de Zinder', type: 'HOPITAL_REGIONAL' },
    { districtRegionCode: 'ZI', districtCode: 'DAMAGARAM_TAKAYA', code: 'CSI-DAMAGARAM-001', nom: 'CSI Damagaram Takaya', type: 'CSI' },
    { districtRegionCode: 'ZI', districtCode: 'GOURE', code: 'CSI-GOURE-001', nom: 'CSI Gouré', type: 'CSI' },
    { districtRegionCode: 'ZI', districtCode: 'MAGARIA', code: 'CSI-MAGARIA-001', nom: 'CSI Magaria', type: 'CSI' },
    { districtRegionCode: 'ZI', districtCode: 'MIRRIAH', code: 'CSI-MIRRIAH-001', nom: 'CSI Mirriah', type: 'CSI' },
    { districtRegionCode: 'ZI', districtCode: 'TANOUT', code: 'CSI-TANOUT-001', nom: 'CSI Tanout', type: 'CSI' },
  ];

  for (const f of formationsData) {
    const districtId = districtMap.get(`${f.districtRegionCode}-${f.districtCode}`);
    if (districtId) {
      await db.insert(formationSanitaire).values({
        districtId,
        code: f.code,
        nom: f.nom,
        type: f.type,
        actif: true,
      }).onConflictDoNothing({ target: formationSanitaire.code });
    }
  }
  console.log('✅ Formations sanitaires insérées');

  // 4. Utilisateurs de test (un par rôle)
  console.log('👥 Insertion des utilisateurs de test...');

  const testUsers = [
    {
      email: 'admin.national@test.com',
      passwordHash: await hashPassword('AdminDev2024!'),
      totpSecret: 'JBSWY3DPEHPK3PXP',
      totpEnabled: false,
      prenom: 'Admin',
      nom: 'National',
      telephone: '+22790000001',
      role: 'ADMIN_NATIONAL',
      regionId: 5, // Niamey
      districtId: 1,
      formationSanitaireId: 1,
      statut: 'ACTIF',
    },
    {
      email: 'superviseur.national@test.com',
      passwordHash: await hashPassword('SuperviseurDev2024!'),
      totpSecret: 'JBSWY3DPEHPK3PXP',
      totpEnabled: true,
      prenom: 'Superviseur',
      nom: 'National',
      telephone: '+22790000002',
      role: 'SUPERVISEUR_NATIONAL',
      regionId: null,
      districtId: null,
      formationSanitaireId: 1,
      statut: 'ACTIF',
    },
    {
      email: 'superviseur.regional@test.com',
      passwordHash: await hashPassword('SuperviseurRegionalDev2024!'),
      totpSecret: 'JBSWY3DPEHPK3PXP',
      totpEnabled: true,
      prenom: 'Superviseur',
      nom: 'Regional',
      telephone: '+22790000003',
      role: 'SUPERVISEUR_REGIONAL',
      regionId: 5, // Niamey
      districtId: 1,
      formationSanitaireId: 1,
      statut: 'ACTIF',
    },
    {
      email: 'agent.sante@test.com',
      passwordHash: await hashPassword('AgentDev2024!'),
      totpSecret: 'JBSWY3DPEHPK3PXP',
      totpEnabled: false,
      prenom: 'Agent',
      nom: 'Sante',
      telephone: '+22790000004',
      role: 'AGENT_SANTE',
      regionId: 5,
      districtId: 1,
      formationSanitaireId: 1,
      statut: 'ACTIF',
    },
  ];

  for (const u of testUsers) {
    await db.insert(utilisateur).values({
      email: u.email,
      passwordHash: u.passwordHash,
      totpSecret: u.totpSecret,
      totpEnabled: u.totpEnabled,
      prenom: u.prenom,
      nom: u.nom,
      telephone: u.telephone,
      role: u.role,
      regionId: u.regionId,
      districtId: u.districtId,
      formationSanitaireId: u.formationSanitaireId,
      statut: u.statut,
    }).onConflictDoNothing({ target: utilisateur.email });
  }
  console.log('✅ Utilisateurs de test insérés');
  const maladiesData = [
    { code: 'PALU', nom: 'Paludisme', nomHaoussa: 'Maleriya', nomZarma: 'Palu', seuilAlerteDistrict: 50, seuilAlerteRegion: 200 },
    { code: 'CHOL', nom: 'Choléra', nomHaoussa: 'Kolera', nomZarma: 'Kolera', seuilAlerteDistrict: 1, seuilAlerteRegion: 5 },
    { code: 'ROUG', nom: 'Rougeole', nomHaoussa: 'Measles', nomZarma: 'Ruzola', seuilAlerteDistrict: 1, seuilAlerteRegion: 5 },
    { code: 'MENI', nom: 'Méningite', nomHaoussa: 'Meningitis', nomZarma: 'Meninjitis', seuilAlerteDistrict: 2, seuilAlerteRegion: 10 },
    { code: 'FIEV', nom: 'Fièvre jaune', nomHaoussa: 'Yellow Fever', nomZarma: 'Fievre Jaune', seuilAlerteDistrict: 1, seuilAlerteRegion: 3 },
    { code: 'POLIO', nom: 'Poliomyélite', nomHaoussa: 'Polio', nomZarma: 'Polio', seuilAlerteDistrict: 1, seuilAlerteRegion: 1 },
    { code: 'TETAN', nom: 'Tétanos néonatal', nomHaoussa: 'Tetanus', nomZarma: 'Tetano', seuilAlerteDistrict: 1, seuilAlerteRegion: 5 },
    { code: 'COQUE', nom: 'Coqueluche', nomHaoussa: 'Whooping Cough', nomZarma: 'Koklush', seuilAlerteDistrict: 5, seuilAlerteRegion: 20 },
    { code: 'DIPH', nom: 'Diphtérie', nomHaoussa: 'Diphtheria', nomZarma: 'Difteri', seuilAlerteDistrict: 1, seuilAlerteRegion: 5 },
    { code: 'RAGE', nom: 'Rage', nomHaoussa: 'Rabies', nomZarma: 'Rabi', seuilAlerteDistrict: 1, seuilAlerteRegion: 3 },
    { code: 'EBOLA', nom: 'Maladie à virus Ebola', nomHaoussa: 'Ebola', nomZarma: 'Ebola', seuilAlerteDistrict: 1, seuilAlerteRegion: 1 },
    { code: 'COVID', nom: 'COVID-19', nomHaoussa: 'COVID-19', nomZarma: 'COVID-19', seuilAlerteDistrict: 10, seuilAlerteRegion: 50 },
    { code: 'VARIO', nom: 'Variole du singe (Mpox)', nomHaoussa: 'Monkeypox', nomZarma: 'Mpox', seuilAlerteDistrict: 1, seuilAlerteRegion: 5 },
  ];

  for (const m of maladiesData) {
    await db.insert(maladieDeclarationObligatoire).values(m).onConflictDoNothing({ target: maladieDeclarationObligatoire.code });
  }
  console.log('✅ Maladies à déclaration obligatoire insérées');

  console.log('🎉 Seed terminé avec succès !');
}

seed()
  .catch((err) => {
    console.error('❌ Erreur lors du seed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });