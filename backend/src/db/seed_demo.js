import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { Counter } from '../models/index.js';
import { isValidPassword } from '../utils/validators.js';

const COLLECTIONS = {
  users: 'users',
  assets: 'assets',
  events: 'assetevents',
  inspections: 'inspections',
  issues: 'maintenanceissues',
  history: 'issuehistories'
};

const RANDOM_SEED = 20260928;
const ASSET_TYPES = [
  { type: 'LAND', prefix: 'LAND', count: 100, department: 'Revenue Department', labels: ['Government Land'] },
  { type: 'BUILDING', prefix: 'BLD', count: 60, department: 'Roads and Buildings Department', labels: ['Government Building'] },
  { type: 'SCHOOL', prefix: 'SCH', count: 110, department: 'Education Department', labels: ['Government Primary School', 'Government Secondary School'] },
  { type: 'PHC', prefix: 'PHC', count: 50, department: 'Health and Family Welfare Department', labels: ['Primary Health Centre'] },
  { type: 'OFFICE', prefix: 'OFC', count: 60, department: 'General Administration Department', labels: ['Village Panchayat Office', 'Revenue Office'] },
  { type: 'COMMUNITY_HALL', prefix: 'HALL', count: 40, department: 'Panchayats, Rural Housing and Rural Development Department', labels: ['Community Hall'] },
  { type: 'WAREHOUSE', prefix: 'WHS', count: 40, department: 'Food, Civil Supplies and Consumer Affairs Department', labels: ['Government Warehouse'] },
  { type: 'STAFF_QUARTERS', prefix: 'QTR', count: 40, department: 'Roads and Buildings Department', labels: ['Staff Quarters'] }
];
const AREAS = {
  LAND: { land: [20000, 400000], built: null },
  BUILDING: { land: [5000, 40000], built: [3000, 20000] },
  SCHOOL: { land: [20000, 120000], built: [6000, 30000] },
  PHC: { land: [6000, 30000], built: [2500, 8000] },
  OFFICE: { land: [3000, 20000], built: [2000, 12000] },
  COMMUNITY_HALL: { land: [4000, 25000], built: [2500, 9000] },
  WAREHOUSE: { land: [12000, 90000], built: [8000, 60000] },
  STAFF_QUARTERS: { land: [2000, 12000], built: [800, 4000] }
};
const DISTRICTS = [
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, talukas: ['Daskroi', 'Sanand', 'Dholka'], places: ['Bavla', 'Viramgam', 'Detroj', 'Mandal'] },
  { name: 'Gandhinagar', lat: 23.2156, lng: 72.6369, talukas: ['Kalol', 'Mansa', 'Dehgam'], places: ['Adalaj', 'Pethapur', 'Rupal', 'Sargasan'] },
  { name: 'Surat', lat: 21.1702, lng: 72.8311, talukas: ['Choryasi', 'Kamrej', 'Olpad'], places: ['Kadodara', 'Palsana', 'Mandvi', 'Mangrol'] },
  { name: 'Vadodara', lat: 22.3072, lng: 73.1812, talukas: ['Savli', 'Padra', 'Waghodia'], places: ['Karjan', 'Dabhoi', 'Sinor', 'Desar'] },
  { name: 'Rajkot', lat: 22.3039, lng: 70.8022, talukas: ['Gondal', 'Jasdan', 'Upleta'], places: ['Jetpur', 'Dhoraji', 'Kotda Sangani', 'Lodhika'] },
  { name: 'Bhavnagar', lat: 21.7645, lng: 72.1519, talukas: ['Sihor', 'Talaja', 'Mahuva'], places: ['Palitana', 'Vallabhipur', 'Ghogha', 'Umrala'] },
  { name: 'Jamnagar', lat: 22.4707, lng: 70.0577, talukas: ['Dhrol', 'Kalavad', 'Jodiya'], places: ['Lalpur', 'Jamjodhpur', 'Sikka', 'Dhunvav'] },
  { name: 'Junagadh', lat: 21.5222, lng: 70.4579, talukas: ['Keshod', 'Mangrol', 'Visavadar'], places: ['Malia', 'Bhesan', 'Vanthali', 'Manavadar'] },
  { name: 'Mehsana', lat: 23.588, lng: 72.3693, talukas: ['Visnagar', 'Unjha', 'Kadi'], places: ['Becharaji', 'Vijapur', 'Kheralu', 'Satlasana'] },
  { name: 'Anand', lat: 22.5645, lng: 72.9289, talukas: ['Petlad', 'Borsad', 'Khambhat'], places: ['Umreth', 'Sojitra', 'Tarapur', 'Anklav'] },
  { name: 'Kutch', lat: 23.242, lng: 69.6669, talukas: ['Anjar', 'Mandvi', 'Bhachau'], places: ['Rapar', 'Nakhatrana', 'Lakhpat', 'Abdasa'] },
  { name: 'Patan', lat: 23.8493, lng: 72.1266, talukas: ['Sidhpur', 'Radhanpur', 'Harij'], places: ['Chanasma', 'Santalpur', 'Sami', 'Sarasvati'] },
  { name: 'Amreli', lat: 21.6032, lng: 71.2221, talukas: ['Rajula', 'Savarkundla', 'Lathi'], places: ['Babra', 'Dhari', 'Bagasara', 'Khambha'] },
  { name: 'Panchmahal', lat: 22.7788, lng: 73.6143, talukas: ['Halol', 'Kalol', 'Shehera'], places: ['Ghoghamba', 'Jambughoda', 'Morwa Hadaf', 'Godhra'] }
];
const COMPONENT_FIELDS = ['building_condition', 'electricity', 'water', 'plumbing', 'fire_safety'];
const ISSUE_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'];
const ISSUE_TITLES = {
  LAND: ['Boundary fencing damaged', 'Boundary marker missing', 'Overgrown vegetation needs clearing'],
  BUILT: ['Roof leakage in main block', 'Damaged electrical wiring', 'Water supply pipe leakage', 'Blocked drainage line', 'Broken doors and window frames', 'Fire extinguishers expired', 'Cracks in load bearing wall', 'Plumbing fixtures not working', 'Damaged boundary wall']
};
const dayMs = 86400000;
let random = createRandom(RANDOM_SEED);

function createRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const randomInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const chance = (probability) => random() < probability;
const choose = (items) => items[Math.floor(random() * items.length)];
const round = (value, places = 2) => Math.round(value * (10 ** places)) / (10 ** places);
const daysAgo = (days, now) => new Date(now.getTime() - days * dayMs);
const addDays = (date, days) => new Date(date.getTime() + days * dayMs);
const newId = () => new mongoose.Types.ObjectId();
const rawCollection = (name) => mongoose.connection.collection(name);

function weighted(items) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of items) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return items.at(-1)[0];
}

function overallCondition(values) {
  if (values.includes('CRITICAL')) return 'CRITICAL';
  if (values.includes('NEEDS_ATTENTION')) return 'NEEDS_ATTENTION';
  if (values.includes('GOOD')) return 'GOOD';
  return 'NOT_APPLICABLE';
}

function inspectionComponents(type, target) {
  if (type === 'LAND') return { building_condition: target, electricity: 'NOT_APPLICABLE', water: 'NOT_APPLICABLE', plumbing: 'NOT_APPLICABLE', fire_safety: 'NOT_APPLICABLE' };
  const values = COMPONENT_FIELDS.map(() => weighted([['GOOD', 92], ['NOT_APPLICABLE', 8]]));
  values[0] = 'GOOD';
  const focus = randomInt(0, values.length - 1);
  if (target === 'NEEDS_ATTENTION') values[focus] = 'NEEDS_ATTENTION';
  if (target === 'CRITICAL') values[focus] = 'CRITICAL';
  return Object.fromEntries(COMPONENT_FIELDS.map((field, index) => [field, values[index]]));
}

function chooseStatus() {
  return weighted([
    ['ACTIVE', 62], ['VACANT', 12], ['UNDER_MAINTENANCE', 8], ['AVAILABLE', 6],
    ['RETIRED', 6], ['TRANSFERRED', 3], ['DISPOSED', 3]
  ]);
}

async function reserveCodes(counterName, count, expression, field) {
  if (count === 0) return [];
  const codes = await rawCollection(field).distinct('asset_code', { asset_code: expression });
  const highestCode = codes.reduce((highest, code) => Math.max(highest, Number(code.match(/(\d+)$/)?.[1] || 0)), 0);
  const currentCounter = await Counter.findOne({ name: counterName }).lean();
  const highest = Math.max(highestCode, currentCounter?.value || 0);
  await Counter.updateOne({ name: counterName }, { $max: { value: highest } }, { upsert: true });
  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: count } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return Array.from({ length: count }, (_, index) => counter.value - count + index + 1);
}

async function reserveAssetCodes(type, prefix, count) {
  return reserveCodes(`asset-${type}`, count, new RegExp(`^GOV-${prefix}-\\d+$`), 'assets')
    .then((numbers) => numbers.map((number) => `GOV-${prefix}-${String(number).padStart(3, '0')}`));
}

async function reserveIssueCodes(count) {
  const numbers = await reserveCodes('issue-code', count, /^ISS-\d+$/, COLLECTIONS.issues);
  return numbers.map((number) => `ISS-${String(number).padStart(6, '0')}`);
}

async function clearDemoData() {
  const demoAssets = await rawCollection(COLLECTIONS.assets).find({ is_demo: true }, { projection: { _id: 1 } }).toArray();
  const assetIds = demoAssets.map(({ _id }) => _id);
  const demoIssues = await rawCollection(COLLECTIONS.issues).find({ is_demo: true }, { projection: { _id: 1 } }).toArray();
  const issueIds = demoIssues.map(({ _id }) => _id);
  const demoUsers = await rawCollection(COLLECTIONS.users).find({ is_demo: true }, { projection: { _id: 1 } }).toArray();
  const userIds = demoUsers.map(({ _id }) => _id);

  await Promise.all([
    rawCollection(COLLECTIONS.history).deleteMany({ $or: [{ is_demo: true }, { issue_id: { $in: issueIds } }] }),
    rawCollection(COLLECTIONS.issues).deleteMany({ $or: [{ is_demo: true }, { asset_id: { $in: assetIds } }] }),
    rawCollection(COLLECTIONS.inspections).deleteMany({ $or: [{ is_demo: true }, { asset_id: { $in: assetIds } }] }),
    rawCollection(COLLECTIONS.events).deleteMany({ $or: [{ is_demo: true }, { asset_id: { $in: assetIds } }] }),
    rawCollection(COLLECTIONS.assets).deleteMany({ is_demo: true }),
    rawCollection(COLLECTIONS.users).deleteMany({ _id: { $in: userIds } })
  ]);
}

async function createDemoUsers(passwordHash, admin) {
  const roles = [
    { full_name: 'Demo Officer One', email: 'demo.officer1@example.com', role: 'OFFICER', department: 'Revenue Department' },
    { full_name: 'Demo Officer Two', email: 'demo.officer2@example.com', role: 'OFFICER', department: 'Revenue Department' },
    { full_name: 'Demo Maintenance One', email: 'demo.maintenance1@example.com', role: 'MAINTENANCE', department: 'Roads and Buildings Department' },
    { full_name: 'Demo Maintenance Two', email: 'demo.maintenance2@example.com', role: 'MAINTENANCE', department: 'Panchayats, Rural Housing and Rural Development Department' }
  ];
  const createdAt = daysAgo(1100, new Date());
  const users = roles.map((user) => ({ _id: newId(), ...user, password_hash: passwordHash, is_active: true, is_demo: true, created_at: createdAt, updated_at: createdAt }));
  await rawCollection(COLLECTIONS.users).insertMany(users);
  return {
    admin: { id: admin._id, fullName: admin.full_name, role: admin.role, department: admin.department },
    officers: users.filter((user) => user.role === 'OFFICER').map((user) => ({ id: user._id, fullName: user.full_name, role: user.role, department: user.department })),
    maintenance: users.filter((user) => user.role === 'MAINTENANCE').map((user) => ({ id: user._id, fullName: user.full_name, role: user.role, department: user.department }))
  };
}

function usedAreaFor(status, capacity) {
  if (status === 'ACTIVE') {
    const roll = random();
    if (roll < 0.09) return round(capacity * (0.05 + random() * 0.3));
    if (roll < 0.12) return null;
    return round(capacity * (0.55 + random() * 0.45));
  }
  if (status === 'VACANT' || status === 'AVAILABLE') return 0;
  if (status === 'UNDER_MAINTENANCE') return round(capacity * (0.2 + random() * 0.4));
  return null;
}

function createInspectionAges(createdAgo) {
  const overdue = chance(0.25);
  const latest = overdue ? randomInt(366, Math.max(366, createdAgo - 5)) : randomInt(5, 330);
  const ages = [latest];
  for (let index = 0, extra = randomInt(0, 2); index < extra; index += 1) {
    const next = ages.at(-1) + randomInt(60, 300);
    if (next > createdAgo - 2) break;
    ages.push(next);
  }
  return ages.reverse();
}

async function generateDemoData(users, now) {
  const allAssets = [];
  const allEvents = [];
  const allInspections = [];
  const allIssues = [];
  const allHistory = [];
  const nameCounts = new Map();
  const noCoordinates = new Set(Array.from({ length: 500 }, (_, index) => index).sort(() => random() - 0.5).slice(0, 12));
  let assetIndex = 0;

  for (const plan of ASSET_TYPES) {
    const codes = await reserveAssetCodes(plan.type, plan.prefix, plan.count);
    for (const assetCode of codes) {
      const id = newId();
      const district = choose(DISTRICTS);
      const village = choose(district.places);
      const taluka = choose(district.talukas);
      const status = chooseStatus();
      const createdAgo = randomInt(420, 1090);
      const createdAt = daysAgo(createdAgo, now);
      const officer = chance(0.94) ? users.officers[DISTRICTS.indexOf(district) < DISTRICTS.length / 2 ? 0 : 1] : null;
      const landRange = AREAS[plan.type].land;
      const builtRange = AREAS[plan.type].built;
      const landArea = randomInt(...landRange);
      const builtArea = builtRange ? randomInt(...builtRange) : null;
      const usedArea = usedAreaFor(status, builtArea ?? landArea);
      const inspected = status === 'UNDER_MAINTENANCE' || chance(plan.type === 'LAND' ? 0.6 : 0.92);
      const targetCondition = !inspected ? 'NOT_APPLICABLE' : status === 'UNDER_MAINTENANCE'
        ? weighted([['NEEDS_ATTENTION', 60], ['CRITICAL', 40]])
        : weighted([['GOOD', 54], ['NEEDS_ATTENTION', 34], ['CRITICAL', 12]]);
      const hasCoordinates = !noCoordinates.has(assetIndex);
      assetIndex += 1;

      let name;
      if (plan.type === 'LAND') name = `Government Land, Survey No. ${randomInt(1, 900)}/${randomInt(1, 9)}, ${village}`;
      else {
        const base = choose(plan.labels);
        const key = `${base}|${village}`;
        const number = (nameCounts.get(key) || 0) + 1;
        nameCounts.set(key, number);
        name = number === 1 ? `${base}, ${village}` : `${base} No. ${number}, ${village}`;
      }

      const asset = {
        _id: id,
        asset_code: assetCode,
        name,
        type: plan.type,
        department: plan.department,
        district: district.name,
        taluka,
        village,
        survey_number: plan.type === 'LAND' || chance(0.4) ? `${randomInt(1, 900)}/${randomInt(1, 9)}` : null,
        latitude: hasCoordinates ? round(district.lat + (random() - 0.5) * 0.1, 6) : null,
        longitude: hasCoordinates ? round(district.lng + (random() - 0.5) * 0.1, 6) : null,
        land_area_sqft: landArea,
        built_up_area_sqft: builtArea,
        used_area_sqft: usedArea,
        status,
        condition: targetCondition,
        assigned_officer_id: officer?.id || null,
        created_by: users.admin.id,
        created_at: createdAt,
        updated_at: createdAt,
        is_demo: true
      };
      const pushEvent = (eventType, description, eventDate, performedBy, metadata = {}) => allEvents.push({
        _id: newId(), asset_id: id, event_type: eventType, description, performed_by: performedBy,
        event_date: eventDate, metadata, created_at: eventDate, is_demo: true
      });
      pushEvent('REGISTERED', 'Asset registered', createdAt, users.admin.id);
      if (officer) pushEvent('ALLOCATED', `Allocated to ${officer.fullName}`, addDays(createdAt, randomInt(1, 20)), users.admin.id, { fromOfficerId: null, toOfficerId: officer.id });
      if (status !== 'ACTIVE' && status !== 'UNDER_MAINTENANCE') pushEvent('STATUS_CHANGED', `Status changed to ${status.toLowerCase().replaceAll('_', ' ')}`, addDays(createdAt, randomInt(20, 120)), officer?.id || users.admin.id, { fromStatus: 'ACTIVE', toStatus: status });

      let latestInspectionAge = null;
      if (inspected) {
        const ages = createInspectionAges(createdAgo);
        for (const [index, age] of ages.entries()) {
          const desired = index === ages.length - 1 ? targetCondition : weighted([['GOOD', 50], ['NEEDS_ATTENTION', 40], ['CRITICAL', 10]]);
          const components = inspectionComponents(plan.type, desired);
          const overall = overallCondition(Object.values(components));
          const inspectionId = newId();
          const inspectedAt = daysAgo(age, now);
          const inspectorId = officer?.id || users.admin.id;
          allInspections.push({ _id: inspectionId, asset_id: id, inspector_id: inspectorId, inspected_at: inspectedAt, ...components, overall_condition: overall, remarks: chance(0.5) ? 'Routine inspection.' : null, status: 'COMPLETED', created_at: inspectedAt, is_demo: true });
          pushEvent('INSPECTED', `Inspection completed, overall condition ${overall.toLowerCase().replaceAll('_', ' ')}`, inspectedAt, inspectorId, { inspectionId, overallCondition: overall });
          if (index === ages.length - 1) {
            asset.condition = overall;
            latestInspectionAge = age;
          }
        }
      }
      asset.updated_at = allEvents.filter((event) => String(event.asset_id) === String(id)).reduce((latest, event) => event.event_date > latest ? event.event_date : latest, createdAt);
      asset._lastInspectionAge = latestInspectionAge;
      allAssets.push(asset);
    }
  }

  const activeAssets = allAssets.filter((asset) => asset.status === 'ACTIVE');
  const attention = activeAssets.filter((asset) => ['NEEDS_ATTENTION', 'CRITICAL'].includes(asset.condition)).sort(() => random() - 0.5);
  const openAssets = attention.slice(0, 30);
  const assignedAssets = attention.slice(30, 55);
  const reservedAssets = new Set([...openAssets, ...assignedAssets]);
  const verifiedAssets = activeAssets.filter((asset) => !reservedAssets.has(asset)).slice(0, 45);
  const underMaintenanceAssets = allAssets.filter((asset) => asset.status === 'UNDER_MAINTENANCE');
  const issueSpecs = [
    ...underMaintenanceAssets.map((asset) => ({ asset, status: chance(0.7) ? 'IN_PROGRESS' : 'RESOLVED' })),
    ...openAssets.map((asset) => ({ asset, status: 'OPEN' })),
    ...assignedAssets.map((asset) => ({ asset, status: 'ASSIGNED' })),
    ...verifiedAssets.map((asset) => ({ asset, status: 'VERIFIED' }))
  ];
  const issueCodes = await reserveIssueCodes(issueSpecs.length);

  for (const [index, spec] of issueSpecs.entries()) {
    const { asset, status } = spec;
    const steps = ISSUE_STATUSES.slice(0, ISSUE_STATUSES.indexOf(status) + 1);
    const minimumAge = steps.length * 9 + 5;
    const maxAge = status === 'OPEN' || status === 'ASSIGNED' ? 120 : 400;
    const createdAt = daysAgo(randomInt(minimumAge, Math.max(minimumAge, Math.min(asset.created_at ? Math.floor((now - asset.created_at) / dayMs) - 20 : maxAge, maxAge))), now);
    const issueId = newId();
    const issueCode = issueCodes[index];
    const reporterId = asset.assigned_officer_id || users.admin.id;
    const maintenanceUser = users.maintenance[DISTRICTS.findIndex((district) => district.name === asset.district) % 2];
    const priority = weighted(asset.condition === 'CRITICAL'
      ? [['CRITICAL', 35], ['HIGH', 45], ['MEDIUM', 20]]
      : asset.condition === 'NEEDS_ATTENTION'
        ? [['HIGH', 20], ['MEDIUM', 55], ['LOW', 25]]
        : [['MEDIUM', 40], ['LOW', 60]]);
    const title = choose(asset.type === 'LAND' ? ISSUE_TITLES.LAND : ISSUE_TITLES.BUILT);
    let eventDate = createdAt;
    let previousStatus = null;
    let resolvedAt = null;

    for (const step of steps) {
      if (previousStatus !== null) eventDate = addDays(eventDate, randomInt(1, 8));
      const changedBy = step === 'OPEN' ? reporterId : step === 'ASSIGNED' || step === 'VERIFIED' ? users.admin.id : maintenanceUser.id;
      allHistory.push({ _id: newId(), issue_id: issueId, from_status: previousStatus, to_status: step, changed_by: changedBy, note: step === 'RESOLVED' ? 'Repair completed.' : step === 'VERIFIED' ? 'Repair checked on site.' : null, created_at: eventDate, is_demo: true });
      if (step === 'OPEN') allEvents.push({ _id: newId(), asset_id: asset._id, event_type: 'ISSUE_REPORTED', description: `Issue reported: ${title}`, performed_by: changedBy, event_date: eventDate, metadata: { issueId, issueCode, priority }, created_at: eventDate, is_demo: true });
      if (step === 'IN_PROGRESS') allEvents.push({ _id: newId(), asset_id: asset._id, event_type: 'MAINTENANCE_STARTED', description: `Maintenance started for ${issueCode}`, performed_by: changedBy, event_date: eventDate, metadata: { issueId, issueCode }, created_at: eventDate, is_demo: true });
      if (step === 'RESOLVED') {
        resolvedAt = eventDate;
        allEvents.push({ _id: newId(), asset_id: asset._id, event_type: 'MAINTENANCE_COMPLETED', description: `Repair completed for ${issueCode}`, performed_by: changedBy, event_date: eventDate, metadata: { issueId, issueCode }, created_at: eventDate, is_demo: true });
      }
      if (step === 'VERIFIED') allEvents.push({ _id: newId(), asset_id: asset._id, event_type: 'ISSUE_VERIFIED', description: `Repair verified for ${issueCode}`, performed_by: changedBy, event_date: eventDate, metadata: { issueId, issueCode }, created_at: eventDate, is_demo: true });
      previousStatus = step;
    }

    allIssues.push({ _id: issueId, issue_code: issueCode, asset_id: asset._id, title, description: `${title} noted at ${asset.name}. Repair is required.`, priority, status, reported_by: reporterId, assigned_department: status === 'OPEN' ? null : maintenanceUser.department, assigned_to: status === 'OPEN' ? null : maintenanceUser.id, created_at: createdAt, updated_at: eventDate, resolved_at: resolvedAt, is_demo: true });
  }

  for (const asset of allAssets) delete asset._lastInspectionAge;
  return { assets: allAssets, events: allEvents, inspections: allInspections, issues: allIssues, history: allHistory };
}

async function insertInBatches(collectionName, documents) {
  const collection = rawCollection(collectionName);
  for (let start = 0; start < documents.length; start += 500) {
    await collection.insertMany(documents.slice(start, start + 500));
  }
}

function tally(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].map(([name, count]) => `${name} ${count}`).join(', ');
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to run in production.');
  if (process.env.ALLOW_DEMO_SEED !== 'true') throw new Error('Set ALLOW_DEMO_SEED=true to continue.');
  await mongoose.connect(config.mongodbUri);
  if (process.argv.includes('--clear')) {
    await clearDemoData();
    process.stdout.write('Demo records removed.\n');
    return;
  }

  const password = process.env.DEMO_USER_PASSWORD || '';
  if (!isValidPassword(password)) throw new Error('Set DEMO_USER_PASSWORD to a password of at least 10 characters containing a letter and a number.');
  const admin = await rawCollection(COLLECTIONS.users).findOne({ role: 'ADMIN', is_active: true });
  if (!admin) throw new Error('Create or activate an ADMIN account before seeding demo data.');

  await clearDemoData();
  random = createRandom(RANDOM_SEED);
  const passwordHash = await bcrypt.hash(password, 12);
  const users = await createDemoUsers(passwordHash, admin);
  const now = new Date();
  const generated = await generateDemoData(users, now);
  await insertInBatches(COLLECTIONS.assets, generated.assets);
  await insertInBatches(COLLECTIONS.events, generated.events);
  await insertInBatches(COLLECTIONS.inspections, generated.inspections);
  await insertInBatches(COLLECTIONS.issues, generated.issues);
  await insertInBatches(COLLECTIONS.history, generated.history);

  process.stdout.write('Demo records created.\n');
  process.stdout.write(`Assets: ${generated.assets.length} (${tally(generated.assets.map((asset) => asset.type))})\n`);
  process.stdout.write(`Users: ${users.officers.length} OFFICER, ${users.maintenance.length} MAINTENANCE\n`);
  process.stdout.write(`Inspections: ${generated.inspections.length}; issues: ${generated.issues.length}\n`);
  process.stdout.write(`Events: ${generated.events.length}; issue history: ${generated.history.length}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
