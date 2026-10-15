(() => {
	const storageKey = 'obayoli-restaurant-manager-v1';
	const appShell = document.querySelector('.app');
	let currentUser = { role: 'public', permissions: { restaurant: { read: true, write: true } } };
	let remoteRevision = 1;
	let remoteReady = true;
	let pendingSaveTimer = null;
	const viewContent = document.getElementById('viewContent');
	let currentLanguage = localStorage.getItem('appLanguage') || 'ar';
	let selectedGeneralStocktakeId = null;

	const translations = {
		ar: {
			dashboard: 'لوحة المتابعة', materials: 'المواد', inventory: 'المخزون', purchaseOrders: 'طلب مواد من المورّد', waste: 'الهدر', consumption: 'صرف للاستهلاك', technicalSheets: 'Fiche technique', dishSales: 'مبيعات الأطباق', invoices: 'الفواتير', suppliers: 'المورّدون', stocktake: 'الجرد', generalStocktake: 'الجرد العام', monthly: 'التقرير الشهري', whatsapp: 'WhatsApp',
			dashboardDesc: 'نظرة يومية على المواد والمخزون وحركة التوريد.', materialsDesc: 'إدارة المواد ووحدات القياس وحدود التنبيه.', inventoryDesc: 'متابعة الأرصدة وتسجيل حركات الدخول والخروج.', purchaseOrdersDesc: 'إنشاء طلبيات التوريد، إرسالها للموردين عبر WhatsApp أو تنزيلها بصيغة PDF.', wasteDesc: 'تسجيل المواد التالفة أو المهدرة ومتابعة كمياتها وأسبابها.', consumptionDesc: 'تسجيل المواد المصروفة للمطبخ والبار ومتابعة استهلاكها.', technicalSheetsDesc: 'بطاقات تقنية للمنتجات مرتبطة بالمواد والأرصدة والجرد.', dishSalesDesc: 'تسجيل مبيعات الأطباق وربطها تلقائيًا باستهلاك مكوناتها من المخزون.', invoicesDesc: 'تسجيل فواتير التوريد وربطها تلقائيًا بالمخزون.', suppliersDesc: 'بيانات التواصل والعناوين والملاحظات الخاصة بالمورّدين.', stocktakeDesc: 'مطابقة الرصيد الفعلي مع النظام واعتماد الفروقات.', generalStocktakeDesc: 'إنشاء مسودات الجرد العام وحفظها واعتماد تسويات المخزون.', monthlyDesc: 'ملخص شهري للفواتير وحركة المواد وأرصدة المخزون.', whatsappDesc: 'إرسال رسائل عبر WhatsApp للمورّدين والعملاء بسهولة.',
			prevSection: 'القسم السابق', nextSection: 'القسم التالي', whatsappTitle: 'WhatsApp', settings: 'الإعدادات', downloadPDF: 'تنزيل PDF'
		},
		en: {
			dashboard: 'Dashboard', materials: 'Materials', inventory: 'Inventory', purchaseOrders: 'Purchase Orders', waste: 'Waste', consumption: 'Consumption', technicalSheets: 'Technical Sheets', dishSales: 'Dish Sales', invoices: 'Invoices', suppliers: 'Suppliers', stocktake: 'Stocktake', generalStocktake: 'General Stocktake', monthly: 'Monthly Report', whatsapp: 'WhatsApp',
			dashboardDesc: 'Daily overview of materials, inventory and supply flow.', materialsDesc: 'Manage materials, units and alert thresholds.', inventoryDesc: 'Track stock levels and record movements.', purchaseOrdersDesc: 'Create purchase orders, send directly via WhatsApp or download as PDF.', wasteDesc: 'Record wasted materials, quantities and causes.', consumptionDesc: 'Record consumed materials for kitchen and bar.', technicalSheetsDesc: 'Technical recipe sheets linked to materials.', dishSalesDesc: 'Record dish sales and auto-deduct ingredients.', invoicesDesc: 'Record supply invoices and auto-update inventory.', suppliersDesc: 'Supplier contacts, addresses and notes.', stocktakeDesc: 'Match actual stock with system records.', generalStocktakeDesc: 'Manage general stocktake drafts and approvals.', monthlyDesc: 'Monthly summary of invoices and movements.', whatsappDesc: 'Direct WhatsApp communication.',
			prevSection: 'Previous', nextSection: 'Next', whatsappTitle: 'WhatsApp', settings: 'Settings', downloadPDF: 'Download PDF'
		},
		fr: {
			dashboard: 'Tableau de bord', materials: 'Matériaux', inventory: 'Inventaire', purchaseOrders: 'Bons de Commande', waste: 'Pertes', consumption: 'Consommation', technicalSheets: 'Fiches techniques', dishSales: 'Ventes de plats', invoices: 'Factures', suppliers: 'Fournisseurs', stocktake: 'Inventaire', generalStocktake: 'Inventaire général', monthly: 'Rapport mensuel', whatsapp: 'WhatsApp',
			dashboardDesc: 'Vue d\'ensemble quotidienne des matériaux et stocks.', materialsDesc: 'Gérer les matériaux et seuils d\'alerte.', inventoryDesc: 'Suivre les stocks et mouvements.', purchaseOrdersDesc: 'Créer des bons de commande, envoyer via WhatsApp ou télécharger en PDF.', wasteDesc: 'Enregistrer les produits perdus ou endommagés.', consumptionDesc: 'Enregistrer les sorties cuisine et bar.', technicalSheetsDesc: 'Fiches techniques liées au stock.', dishSalesDesc: 'Enregistrer les ventes et déduire les ingrédients.', invoicesDesc: 'Enregistrer les factures de fourniture.', suppliersDesc: 'Coordonnées et détails des fournisseurs.', stocktakeDesc: 'Rapprochement des stocks physiques.', generalStocktakeDesc: 'Gestion des inventaires généraux.', monthlyDesc: 'Synthèse mensuelle des factures et flux.', whatsappDesc: 'Communication WhatsApp directe.',
			prevSection: 'Précédent', nextSection: 'Suivant', whatsappTitle: 'WhatsApp', settings: 'Paramètres', downloadPDF: 'Télécharger PDF'
		}
	};

	const money = value => `${new Intl.NumberFormat('ar-MA', { maximumFractionDigits: 2 }).format(Number(value) || 0)} د.م.`;
	const quantity = value => {
		const number = Number(value);
		const amount = Number.isFinite(number) ? number : 0;
		const formatted = new Intl.NumberFormat('ar-MA', { maximumFractionDigits: 2 }).format(Math.abs(amount));
		return amount < 0 ? `−${formatted}` : formatted;
	};
	const today = () => new Intl.DateTimeFormat('en-CA').format(new Date());
	const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
	const state = loadState();

	function getDemoData() {
		const s1 = { id: 'sup-1', name: 'مورّد اللحوم والدواجن الطازجة', contact: 'أحمد المنصوري', phone: '+212661234567', email: 'contact@viande-obayoli.ma', rebBanque: '007780000123456789012345', address: 'سوق الجملة للّحوم، الدار البيضاء', workDays: ['الاثنين', 'الأربعاء', 'الجمعة'], notes: 'توصيل صباحي مبكر في حدود الساعة 7:30 صباحاً.' };
		const s2 = { id: 'sup-2', name: 'شركة الألبان والأجبان الممتازة', contact: 'يوسف العلمي', phone: '+212662987654', email: 'commandes@fromagerie.ma', rebBanque: '021110000987654321098765', address: 'المنطقة الصناعية سيدي معروف، الدار البيضاء', workDays: ['الاثنين', 'الثلاثاء', 'الخميس'], notes: 'مورّد معتمد للموزاريلا والقشدة الطازجة والزبدة.' };
		const s3 = { id: 'sup-3', name: 'مستودع البقالة والمشروبات والمطاحن', contact: 'كمال بنجلون', phone: '+212664556677', email: 'groceries@casadistrib.ma', rebBanque: '011220000112233445566778', address: 'عين السبع، الدار البيضاء', workDays: ['الاثنين', 'الخميس'], notes: 'توفير الدقيق، الزيوت، المعلبات وصلصات البيتزا.' };
		const s4 = { id: 'sup-4', name: 'مورّد الخضار والفواكه الطازجة', contact: 'رشيد بنيس', phone: '+212663112233', email: 'primeurs@marchegros.ma', rebBanque: '014330000334455667788990', address: 'سوق الجملة للخضر والفواكه، الدار البيضاء', workDays: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], notes: 'توريد طماطم وبطاطس وبصل وخضار يومية طازجة.' };

		const m1 = { id: 'mat-1', name: 'لحم مفروم بقري طازج', category: 'viande', unit: 'kg', quantity: 18.5, minimum: 10, cost: 95.0, fex: 90.0, barcode: '6111234567890', supplier: s1.name };
		const m2 = { id: 'mat-2', name: 'صدور دجاج طازجة', category: 'volailles', unit: 'kg', quantity: 24.0, minimum: 15, cost: 58.0, fex: 55.0, barcode: '6111234567891', supplier: s1.name };
		const m3 = { id: 'mat-3', name: 'جبن موزاريلا إيطالي مبشور', category: 'fromage', unit: 'kg', quantity: 7.5, minimum: 12, cost: 78.0, fex: 75.0, barcode: '6111234567892', supplier: s2.name };
		const m4 = { id: 'mat-4', name: 'طماطم طازجة', category: 'legume', unit: 'kg', quantity: 5.0, minimum: 10, cost: 8.5, fex: 7.0, barcode: '6111234567894', supplier: s4.name };
		const m5 = { id: 'mat-5', name: 'صلصة طماطم بيتزا بالريحان', category: 'sauce', unit: 'kg', quantity: 16.0, minimum: 8, cost: 24.0, fex: 22.0, barcode: '6111234567893', supplier: s3.name };
		const m6 = { id: 'mat-6', name: 'دقيق ممتاز T55 للبيتزا والخبز', category: 'poudre', unit: 'kg', quantity: 75.0, minimum: 30, cost: 6.5, fex: 6.0, barcode: '6111234567895', supplier: s3.name };
		const m7 = { id: 'mat-7', name: 'زيت زيتون بكر ممتاز', category: 'liquide', unit: 'bouteille', quantity: 14, minimum: 6, cost: 85.0, fex: 80.0, barcode: '6111234567896', supplier: s3.name };
		const m8 = { id: 'mat-8', name: 'خبز برجر بالسمسم (Pain Burger)', category: 'produits laitiers', unit: 'pc', quantity: 55, minimum: 25, cost: 2.8, fex: 2.5, barcode: '6111234567897', supplier: s3.name };
		const m9 = { id: 'mat-9', name: 'بطاطس للقلي (Frites)', category: 'legume', unit: 'kg', quantity: 42.0, minimum: 20, cost: 6.5, fex: 6.0, barcode: '6111234567898', supplier: s4.name };
		const m10 = { id: 'mat-10', name: 'حبوب قهوة إسبريسو ممتازة', category: 'boisson', unit: 'kg', quantity: 3.5, minimum: 6, cost: 160.0, fex: 150.0, barcode: '6111234567899', supplier: s3.name };
		const m11 = { id: 'mat-11', name: 'حليب كامل الدسم UHT', category: 'produits laitiers', unit: 'bouteille', quantity: 38, minimum: 15, cost: 9.5, fex: 9.0, barcode: '6111234567800', supplier: s2.name };
		const m12 = { id: 'mat-12', name: 'شاي أخضر صيني فاخر', category: 'boisson', unit: 'kg', quantity: 8.0, minimum: 3, cost: 65.0, fex: 60.0, barcode: '6111234567801', supplier: s3.name };

		const recipe1 = {
			id: 'recipe-1',
			kind: 'recipe',
			name: 'برجر OBAYOLI الكلاسيكي الفاخر',
			category: 'أطباق رئيسية',
			yield: 1,
			department: 'cuisine',
			prepTime: 12,
			cookTime: 8,
			difficulty: 'easy',
			sellingPrice: 65.0,
			preparation: '1. تحميص خبز البرجر بخفة على الشواية.\n2. طهي 160غ من اللحم المفروم المتبل مع قليل من الملح والفلفل الأسود.\n3. وضع 40غ جبن موزاريلا فوق اللحم ليذوب تماماً.\n4. إضافة شريحة طماطم وصلصة البيتزا والتقديم مع 150غ بطاطس مقلية ذهبية.',
			notes: 'الطبق الأكثر طلباً في قائمة الغداء والعشاء.',
			lines: [
				{ materialId: m1.id, quantity: 0.16, type: 'material' },
				{ materialId: m8.id, quantity: 1, type: 'material' },
				{ materialId: m3.id, quantity: 0.04, type: 'material' },
				{ materialId: m4.id, quantity: 0.03, type: 'material' },
				{ materialId: m9.id, quantity: 0.15, type: 'material' }
			]
		};

		const recipe2 = {
			id: 'recipe-2',
			kind: 'recipe',
			name: 'بيتزا مارغريتا إيطالية (Pizza Margherita)',
			category: 'بيتزا',
			yield: 1,
			department: 'cuisine',
			prepTime: 15,
			cookTime: 7,
			difficulty: 'medium',
			sellingPrice: 55.0,
			preparation: '1. فرد 200غ من عجينة البيتزا المحضرة بالدقيق الممتاز وزيت الزيتون.\n2. مد 90غ من صلصة الطماطم الغنية بالريحان على كامل السطح.\n3. توزيع 130غ من جبن الموزاريلا المبشور بالتساوي.\n4. الخبز على فرن حراري على درجة حرارة 320° مئوية لمدة 7 دقائق.',
			notes: 'تُزين بأوراق الريحان الطازج وقطرات من زيت الزيتون البكر بعد الخبز.',
			lines: [
				{ materialId: m6.id, quantity: 0.20, type: 'material' },
				{ materialId: m7.id, quantity: 0.02, type: 'material' },
				{ materialId: m5.id, quantity: 0.09, type: 'material' },
				{ materialId: m3.id, quantity: 0.13, type: 'material' }
			]
		};

		const recipe3 = {
			id: 'recipe-3',
			kind: 'recipe',
			name: 'إسبريسو / كابوتشينو كافيه لاتيه',
			category: 'مشروبات ساخنة',
			yield: 1,
			department: 'bar',
			prepTime: 3,
			cookTime: 2,
			difficulty: 'easy',
			sellingPrice: 22.0,
			preparation: '1. طحن 18غ من حبوب القهوة الطازجة.\n2. استخلاص شوت إسبريسو مزدوج غني بالكريمة.\n3. تبخير 150 مل حليب كامل الدسم حتى الحصول على رغوة مخملية.',
			notes: 'تقديم مع قطعتي سكر بني وبسكويت صغير.',
			lines: [
				{ materialId: m10.id, quantity: 0.018, type: 'material' },
				{ materialId: m11.id, quantity: 0.15, type: 'material' }
			]
		};

		const todayStr = today();
		const invoice1 = {
			id: 'inv-1',
			number: 'FA-2026-089',
			supplier: s1.name,
			date: todayStr,
			subtotal: 3147.50,
			vatAmount: 629.50,
			total: 3777.00,
			vatRate: 20,
			lines: [
				{ materialId: m1.id, quantity: 20, unitCost: 95.0, vatRate: 20 },
				{ materialId: m2.id, quantity: 21.5, unitCost: 58.0, vatRate: 20 }
			]
		};

		const invoice2 = {
			id: 'inv-2',
			number: 'FA-2026-092',
			supplier: s2.name,
			date: todayStr,
			subtotal: 1324.00,
			vatAmount: 264.80,
			total: 1588.80,
			vatRate: 20,
			lines: [
				{ materialId: m3.id, quantity: 12, unitCost: 78.0, vatRate: 20 },
				{ materialId: m11.id, quantity: 40, unitCost: 9.5, vatRate: 20 }
			]
		};

		const order1 = {
			id: 'po-1',
			number: 'BC-20261014-01',
			supplier: s2.name,
			phone: s2.phone,
			date: todayStr,
			status: 'sent',
			totalEstimated: 936.0,
			notes: 'يرجى التوصيل غداً صباحاً قبل الساعة 9:00 صباحاً كحد أقصى.',
			createdAt: new Date().toISOString(),
			items: [
				{ materialId: m3.id, name: m3.name, quantity: 12, unit: m3.unit, price: m3.cost }
			]
		};

		const movements = [
			{ id: 'mov-1', materialId: m1.id, materialName: m1.name, unit: m1.unit, type: 'in', quantity: 20, cost: m1.cost, note: 'فاتورة FA-2026-089', date: todayStr, reference: invoice1.id, department: '', createdAt: new Date().toISOString() },
			{ id: 'mov-2', materialId: m2.id, materialName: m2.name, unit: m2.unit, type: 'in', quantity: 21.5, cost: m2.cost, note: 'فاتورة FA-2026-089', date: todayStr, reference: invoice1.id, department: '', createdAt: new Date().toISOString() },
			{ id: 'mov-3', materialId: m3.id, materialName: m3.name, unit: m3.unit, type: 'in', quantity: 12, cost: m3.cost, note: 'فاتورة FA-2026-092', date: todayStr, reference: invoice2.id, department: '', createdAt: new Date().toISOString() },
			{ id: 'mov-4', materialId: m1.id, materialName: m1.name, unit: m1.unit, type: 'out', quantity: 4.8, cost: m1.cost, note: 'بيع طبق: برجر OBAYOLI الكلاسيكي الفاخر', date: todayStr, reference: recipe1.id, department: 'cuisine', createdAt: new Date().toISOString() },
			{ id: 'mov-5', materialId: m3.id, materialName: m3.name, unit: m3.unit, type: 'out', quantity: 2.6, cost: m3.cost, note: 'صرف استهلاك المطبخ لوجبة الغداء', date: todayStr, reference: '', department: 'cuisine', createdAt: new Date().toISOString() },
			{ id: 'mov-6', materialId: m4.id, materialName: m4.name, unit: m4.unit, type: 'waste', quantity: 1.5, cost: m4.cost, note: 'تلف طبيعي أثناء التخزين والرطوبة', date: todayStr, reference: '', department: '', createdAt: new Date().toISOString() }
		];

		const dishSales = [
			{ id: 'sale-1', dishName: recipe1.name, quantity: 30, date: todayStr, department: 'cuisine', note: 'طلبيات الغداء والتوصيل' },
			{ id: 'sale-2', dishName: recipe2.name, quantity: 18, date: todayStr, department: 'cuisine', note: 'مبيعات الصالة المسائية' },
			{ id: 'sale-3', dishName: recipe3.name, quantity: 45, date: todayStr, department: 'bar', note: 'مبيعات الكافيه الصباحية' }
		];

		return {
			materials: [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12],
			suppliers: [s1, s2, s3, s4],
			technicalSheets: [recipe1, recipe2, recipe3],
			invoices: [invoice1, invoice2],
			purchaseOrders: [order1],
			movements: movements,
			dishSales: dishSales,
			stocktakes: [
				{ id: 'stk-1', date: todayStr, items: [{ materialId: m1.id, name: m1.name, actual: 18.5, diff: 0 }, { materialId: m2.id, name: m2.name, actual: 24.0, diff: 0 }, { materialId: m3.id, name: m3.name, actual: 7.5, diff: 0 }] }
			],
			monthlyArchives: [],
			reportMonth: todayStr.slice(0, 7)
		};
	}

	function loadState() {
		try {
			const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
			if (!Array.isArray(saved.materials) || saved.materials.length === 0) {
				const demo = getDemoData();
				localStorage.setItem(storageKey, JSON.stringify(demo));
				return demo;
			}
			return {
				materials: Array.isArray(saved.materials) ? saved.materials : [],
				invoices: Array.isArray(saved.invoices) ? saved.invoices : [],
				purchaseOrders: Array.isArray(saved.purchaseOrders) ? saved.purchaseOrders : [],
				movements: Array.isArray(saved.movements) ? saved.movements : [],
				stocktakes: Array.isArray(saved.stocktakes) ? saved.stocktakes : [],
				suppliers: Array.isArray(saved.suppliers) ? saved.suppliers : [],
				technicalSheets: Array.isArray(saved.technicalSheets) ? saved.technicalSheets : [],
				dishSales: Array.isArray(saved.dishSales) ? saved.dishSales : [],
				monthlyArchives: Array.isArray(saved.monthlyArchives) ? saved.monthlyArchives : [],
				reportMonth: typeof saved.reportMonth === 'string' ? saved.reportMonth : today().slice(0, 7)
			};
		} catch (e) {
			const demo = getDemoData();
			localStorage.setItem(storageKey, JSON.stringify(demo));
			return demo;
		}
	}

	function saveState() {
		localStorage.setItem(storageKey, JSON.stringify(state));
		clearTimeout(pendingSaveTimer);
		pendingSaveTimer = setTimeout(async () => {
			if (window.ObayoliCloud?.saveState) {
				try {
					const res = await window.ObayoliCloud.saveState('restaurant', structuredClone(state), remoteRevision);
					if (res?.revision) remoteRevision = res.revision;
				} catch (e) {
					console.warn('Cloud save fallback:', e);
				}
			}
		}, 300);
		return true;
	}

	function toast(msg) {
		const el = document.getElementById('toast');
		if (!el) return;
		el.textContent = msg;
		el.hidden = false;
		clearTimeout(toast.timer);
		toast.timer = setTimeout(() => { el.hidden = true; }, 3200);
	}

	function icon(name) { return `<i data-lucide="${name}"></i>`; }
	function refreshIcons() { if (window.lucide) lucide.createIcons({ nodes: [document.body] }); }

	function setHeader(view) {
		const t = translations[currentLanguage] || translations.ar;
		const bEl = document.getElementById('breadcrumb');
		if (bEl) bEl.textContent = t[view] || view;

		const navItems = [...document.querySelectorAll('.nav-item')];
		navItems.forEach(btn => {
			const active = btn.dataset.view === view;
			btn.classList.toggle('active', active);
			if (active) btn.scrollIntoView({ block: 'nearest', inline: 'center' });
		});
	}

	function emptyState(title, desc) {
		return `<div class="empty-state">${icon('package-open')}<strong>${esc(title)}</strong>${esc(desc)}</div>`;
	}

	function lowStock(material) {
		return Number(material.quantity) <= Number(material.minimum);
	}

	function addMovement(material, type, amount, note, date = today(), reference = '', department = '', customCost = null) {
		state.movements.unshift({
			id: id(),
			materialId: material.id,
			materialName: material.name,
			unit: material.unit,
			type,
			quantity: Number(amount),
			cost: customCost !== null ? Number(customCost) : Number(material.cost) || 0,
			note: note || '',
			date,
			reference,
			department,
			createdAt: new Date().toISOString()
		});
	}

	function movementTotals(materialId) {
		return state.movements.filter(m => m.materialId === materialId).reduce((acc, m) => {
			if (m.type === 'in') {
				acc.in += Number(m.quantity);
				acc.inValue += Number(m.quantity) * (Number(m.cost) || 0);
			} else {
				acc.out += Number(m.quantity);
			}
			return acc;
		}, { in: 0, out: 0, inValue: 0 });
	}

	// 1. Dashboard View - Exactly matching screenshot_1.png
	function renderDashboard() {
		setHeader('dashboard');
		const lowMaterials = state.materials.filter(lowStock);
		const stockValue = state.materials.reduce((sum, m) => sum + Number(m.quantity) * Number(m.cost), 0);
		const currentM = today().slice(0, 7);
		const invoiceTotal = state.invoices.filter(inv => inv.date?.startsWith(currentM)).reduce((sum, inv) => sum + Number(inv.total), 0);
		const monthlyConsumption = state.movements
			.filter(m => m.type === 'out' && m.date?.startsWith(currentM))
			.reduce((sum, m) => {
				const mat = state.materials.find(x => x.id === m.materialId);
				return sum + (Number(m.quantity) || 0) * (Number(m.cost ?? mat?.cost) || 0);
			}, 0);

		const lowRows = lowMaterials.slice(0, 6).map(m => `
			<tr>
				<td><span class="item-main">${esc(m.name)}</span><div class="item-sub">${esc(m.category || 'بدون تصنيف')}</div></td>
				<td class="stock-quantity low">${quantity(m.quantity)} ${esc(m.unit)}</td>
				<td>${quantity(m.minimum)} ${esc(m.unit)}</td>
				<td><span class="badge badge-low">منخفض</span></td>
			</tr>
		`).join('');

		const invoiceRows = state.invoices.slice(0, 5).map(inv => `
			<tr>
				<td><span class="item-main">${esc(inv.supplier)}</span><div class="item-sub">${esc(inv.number || 'بدون رقم')}</div></td>
				<td>${esc(inv.date)}</td>
				<td>${money(inv.total)}</td>
			</tr>
		`).join('');

		// The 5 Colored Cards exactly as in screenshot_1.png:
		// Right to Left in RTL:
		// 1. عدد المواد (Blue)
		// 2. مواد تحت الحد (Red)
		// 3. قيمة المخزون (Amber/Brown)
		// 4. فواتير هذا الشهر (Magenta)
		// 5. استهلاك هذا الشهر (Golden Yellow)
		const cardsHtml = `
			<div class="metric-grid-5">
				<article class="metric-card-styled card-blue">
					<div class="metric-card-header">
						<span class="metric-card-title">عدد المواد</span>
						<span class="metric-card-icon">${icon('package')}</span>
					</div>
					<div class="metric-card-value">${state.materials.length}</div>
					<div class="metric-card-note">مادة مسجلة</div>
				</article>

				<article class="metric-card-styled card-red">
					<div class="metric-card-header">
						<span class="metric-card-title">مواد تحت الحد</span>
						<span class="metric-card-icon">${icon('triangle-alert')}</span>
					</div>
					<div class="metric-card-value">${lowMaterials.length}</div>
					<div class="metric-card-note">تحتاج توريد</div>
				</article>

				<article class="metric-card-styled card-amber">
					<div class="metric-card-header">
						<span class="metric-card-title">قيمة المخزون</span>
						<span class="metric-card-icon">${icon('coins')}</span>
					</div>
					<div class="metric-card-value">${money(stockValue)}</div>
					<div class="metric-card-note">بالتكلفة التقديرية</div>
				</article>

				<article class="metric-card-styled card-magenta">
					<div class="metric-card-header">
						<span class="metric-card-title">فواتير هذا الشهر</span>
						<span class="metric-card-icon">${icon('receipt')}</span>
					</div>
					<div class="metric-card-value">${money(invoiceTotal)}</div>
					<div class="metric-card-note">إجمالي التوريد</div>
				</article>

				<article class="metric-card-styled card-yellow">
					<div class="metric-card-header">
						<span class="metric-card-title">استهلاك هذا الشهر</span>
						<span class="metric-card-icon">${icon('package-minus')}</span>
					</div>
					<div class="metric-card-value">${money(monthlyConsumption)}</div>
					<div class="metric-card-note">تكلفة الصرف</div>
				</article>
			</div>
		`;

		const alertCardsHtml = lowMaterials.map(m => {
			const isOutOfStock = Number(m.quantity) <= 0;
			const deficit = Math.max(0, (Number(m.minimum) || 0) - (Number(m.quantity) || 0));
			const suggestedOrder = Math.max(1, (Number(m.minimum) || 0) * 2 - (Number(m.quantity) || 0));
			return `
				<div class="stock-alert-card ${isOutOfStock ? 'is-out' : 'is-low'}">
					<div class="stock-alert-card-header">
						<div class="stock-alert-card-info">
							<div class="stock-alert-card-name" title="${esc(m.name)}">${esc(m.name)}</div>
							<div class="stock-alert-card-cat">${esc(m.category || 'عام')}${m.supplier ? ` • المورّد: <strong>${esc(m.supplier)}</strong>` : ''}</div>
						</div>
						<span class="stock-alert-badge ${isOutOfStock ? 'badge-critical' : 'badge-warn'}">
							${icon(isOutOfStock ? 'octagon-alert' : 'triangle-alert')}
							${isOutOfStock ? 'نفد تماماً (0)' : 'تحت الحد الأدنى'}
						</span>
					</div>
					<div class="stock-alert-card-metrics">
						<div class="stock-alert-metric">
							<span class="stock-alert-metric-label">الرصيد الفعلي</span>
							<strong class="stock-alert-metric-value ${isOutOfStock ? 'text-red' : 'text-amber'}">${quantity(m.quantity)} ${esc(m.unit)}</strong>
						</div>
						<div class="stock-alert-metric">
							<span class="stock-alert-metric-label">حد التنبيه</span>
							<strong class="stock-alert-metric-value">${quantity(m.minimum)} ${esc(m.unit)}</strong>
						</div>
						<div class="stock-alert-metric">
							<span class="stock-alert-metric-label">العجز التقديري</span>
							<strong class="stock-alert-metric-value text-red">-${quantity(deficit)} ${esc(m.unit)}</strong>
						</div>
					</div>
					<div class="stock-alert-card-actions">
						<button class="button button-primary alert-action-btn" type="button" data-quick-order-material="${esc(m.id)}" title="طلب فوري عبر WhatsApp">
							${icon('shopping-cart')}طلب الآن (${quantity(suggestedOrder)} ${esc(m.unit)})
						</button>
						<button class="button button-secondary alert-action-btn" type="button" data-quick-invoice-material="${esc(m.id)}" title="تسجيل توريد سريع">
							${icon('plus')}توريد
						</button>
					</div>
				</div>
			`;
		}).join('');

		const alertSectionHtml = lowMaterials.length ? `
			<section class="stock-alert-section">
				<div class="stock-alert-banner">
					<div class="stock-alert-banner-main">
						<div class="stock-alert-icon-pulse">
							${icon('bell-ring')}
						</div>
						<div>
							<div class="stock-alert-title">
								<span>تنبيه المخزون الحرج: يوجد ${lowMaterials.length} مواد وصلت لحد التنبيه الأدنى أو نفدت!</span>
							</div>
							<p class="stock-alert-desc">هذه المواد تتطلب إجراءً سريعاً لتفادي توقف الخدمة أو نقص المخزون في المطبخ.</p>
						</div>
					</div>
					<div class="stock-alert-banner-actions">
						<button class="button button-primary alert-banner-main-btn" type="button" id="alertOrderAllLowBtn">
							${icon('message-circle')}طلب جميع النواقص عبر WhatsApp (${lowMaterials.length})
						</button>
						<button class="button button-secondary" type="button" data-open-dialog="invoiceDialog">
							${icon('receipt')}تسجيل فاتورة
						</button>
						<button class="button button-secondary" type="button" data-navigate="inventory">
							${icon('boxes')}عرض في المخزون
						</button>
					</div>
				</div>
				<div class="stock-alert-cards-grid">
					${alertCardsHtml}
				</div>
			</section>
		` : `
			<div class="stock-safe-banner">
				<div class="stock-safe-icon">${icon('check-circle-2')}</div>
				<div>
					<strong>حالة المخزون ممتازة ومستقرة:</strong>
					<span>جميع المواد المتوفرة أعلى من حدود التنبيه الدنيا، ولا توجد نواقص بحاجة للتوريد حالياً.</span>
				</div>
			</div>
		`;

		viewContent.innerHTML = `
			${cardsHtml}
			${alertSectionHtml}
			<div class="dashboard-grid">
				<section class="panel">
					<div class="panel-head">
						<div><h2>المواد التي تحتاج متابعة</h2><div class="panel-subtitle">الرصيد وصل لحد التنبيه أو أقل</div></div>
						<div class="toolbar-actions">
							${lowMaterials.length ? `<button class="button button-secondary" id="dashOrderLowStockBtn" style="font-size:11px;padding:3px 9px;min-height:28px;background:#eef6f3;color:#0e5a44;border-color:#b9dfcf;">${icon('shopping-cart')}طلب النواقص (${lowMaterials.length})</button>` : ''}
							<button class="panel-link" data-navigate="inventory">عرض المخزون</button>
						</div>
					</div>
					${lowRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>المادة</th><th>الرصيد</th><th>حد التنبيه</th><th>الحالة</th></tr></thead><tbody>${lowRows}</tbody></table></div>` : emptyState('المخزون سليم', 'لا توجد مواد وصلت لحد التنبيه.')}
				</section>
				<section class="panel">
					<div class="panel-head"><div><h2>أحدث الفواتير</h2><div class="panel-subtitle">آخر التوريدات المسجلة</div></div><button class="panel-link" data-navigate="invoices">عرض الكل</button></div>
					${invoiceRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>المورّد</th><th>التاريخ</th><th>الإجمالي</th></tr></thead><tbody>${invoiceRows}</tbody></table></div>` : emptyState('لا توجد فواتير', 'سجّل أول فاتورة توريد لتحديث الأرصدة.')}
				</section>
			</div>
			<section class="panel">
				<div class="panel-head"><h2>إجراءات سريعة</h2></div>
				<div class="panel-body toolbar-actions">
					<button class="button button-primary" data-navigate="purchaseOrders">${icon('shopping-cart')}طلب مواد من المورّد</button>
					<button class="button button-secondary" data-open-dialog="invoiceDialog">${icon('plus')}تسجيل فاتورة</button>
					<button class="button button-secondary" data-open-dialog="materialDialog">${icon('package-plus')}إضافة مادة</button>
					<button class="button button-secondary" data-navigate="stocktake">${icon('clipboard-check')}بدء الجرد</button>
				</div>
			</section>
		`;
		refreshIcons();
	}

	// 2. Materials View
	function renderMaterials(search = '') {
		setHeader('materials', `<button class="button button-secondary" type="button" data-start-barcode-scan>${icon('camera')}مسح بالباركود</button>`);
		const term = search.trim().toLowerCase();
		const matching = state.materials.filter(m => `${m.name} ${m.category} ${m.supplier} ${m.barcode}`.toLowerCase().includes(term));

		const rows = matching.map(m => `
			<tr>
				<td><span class="item-main">${esc(m.name)}</span><div class="item-sub">${esc(m.category || 'بدون تصنيف')}</div>${m.barcode ? `<div class="item-sub" dir="ltr">EAN: ${esc(m.barcode)}</div>` : ''}</td>
				<td>${esc(m.unit)}</td>
				<td>${money(Number(m.fex) || 0)}</td>
				<td>${money(Number(m.cost) || 0)}</td>
				<td>${esc(m.supplier || '—')}</td>
				<td>
					<div class="toolbar-actions">
						<button class="icon-button" data-edit-material="${esc(m.id)}" aria-label="تعديل ${esc(m.name)}" title="تعديل">${icon('pencil')}</button>
						<button class="icon-button" data-delete-material="${esc(m.id)}" aria-label="حذف ${esc(m.name)}" title="حذف">${icon('trash-2')}</button>
					</div>
				</td>
			</tr>
		`).join('');

		const addBtn = `<button class="button button-primary" data-open-dialog="materialDialog">${icon('plus')}إضافة مادة جديدة</button>`;

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>دليل المواد</h2><div class="panel-subtitle">${state.materials.length} مادة مسجلة</div></div>
					<label class="search-field">${icon('search')}<input id="materialSearch" type="search" value="${esc(search)}" placeholder="ابحث عن مادة أو تصنيف أو باركود..." aria-label="بحث المواد"></label>
				</div>
				<div class="panel-body toolbar-actions">${addBtn}</div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>المادة</th><th>الوحدة</th><th>سعر FEX (د.م.)</th><th>تكلفة الشراء (د.م.)</th><th>المورّد</th><th>إجراءات</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState(search ? 'لا توجد نتائج' : 'ابدأ بإضافة المواد', search ? 'جرّب عبارة بحث أخرى.' : 'أضف المواد لمتابعة أرصدتها.')}
			</section>
		`;
		refreshIcons();
	}

	// 3. Inventory View
	function renderInventory(search = '', movementSearch = '') {
		setHeader('inventory', `<button class="button button-secondary" type="button" data-start-barcode-scan data-barcode-purpose="lookup">${icon('camera')}مسح للبحث</button><button class="button button-secondary" data-open-dialog="movementDialog">${icon('arrow-left-right')}حركة مخزون</button>`);
		const term = search.trim().toLowerCase();
		const matching = state.materials.filter(m => `${m.name} ${m.category} ${m.supplier} ${m.barcode}`.toLowerCase().includes(term));

		const rows = matching.map(m => {
			const totals = movementTotals(m.id);
			const isLow = lowStock(m);
			return `
				<tr data-inventory-material="${esc(m.id)}">
					<td><span class="item-main">${esc(m.name)}</span><div class="item-sub">${esc(m.category || '')}</div></td>
					<td>
						<div class="toolbar-actions">
							<span>${quantity(totals.in)} ${esc(m.unit)}</span>
							<button class="icon-button" data-stock-movement="${esc(m.id)}" data-stock-movement-type="in" title="إضافة دخول">${icon('plus')}</button>
						</div>
					</td>
					<td>${quantity(totals.out)} ${esc(m.unit)}</td>
					<td class="stock-quantity ${isLow ? 'low' : ''}">${quantity(m.quantity)} ${esc(m.unit)}</td>
					<td>${quantity(m.minimum)} ${esc(m.unit)}</td>
					<td>${money(Number(m.quantity) * Number(m.cost))}</td>
					<td>${money(Number(m.fex) || 0)}</td>
					<td><span class="badge ${isLow ? 'badge-low' : 'badge-ok'}">${isLow ? 'تحت الحد' : 'متوفر'}</span></td>
					<td>
						<div class="toolbar-actions">
							<button class="icon-button" data-edit-stock="${esc(m.id)}" title="تعديل المخزون">${icon('sliders-horizontal')}</button>
							<button class="icon-button" data-zero-stock="${esc(m.id)}" title="تصفير المخزون">${icon('circle-x')}</button>
						</div>
					</td>
				</tr>
			`;
		}).join('');

		const mTerm = movementSearch.trim().toLowerCase();
		const matchingMovements = state.movements.filter(m => `${m.date} ${m.materialName} ${m.note} ${m.type}`.toLowerCase().includes(mTerm)).slice(0, 15);
		const movementRows = matchingMovements.map(m => `
			<tr>
				<td>${esc(m.date)}</td>
				<td>${esc(m.materialName)}</td>
				<td><span class="badge ${m.type === 'in' ? 'badge-in' : m.type === 'waste' ? 'badge-low' : 'badge-out'}">${m.type === 'in' ? 'دخول' : m.type === 'waste' ? 'هدر' : 'خروج'}</span></td>
				<td>${quantity(m.quantity)} ${esc(m.unit)}</td>
				<td>${money(m.cost)}</td>
				<td>${money(Number(m.quantity) * (Number(m.cost) || 0))}</td>
				<td>${esc(m.note || m.reference || '—')}</td>
				<td><button class="icon-button" data-delete-movement="${esc(m.id)}" title="حذف الحركة">${icon('trash-2')}</button></td>
			</tr>
		`).join('');

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>الأرصدة الحالية</h2><div class="panel-subtitle">إجمالي الدخول والخروج والأسعار</div></div>
					<label class="search-field">${icon('search')}<input id="inventorySearch" type="search" value="${esc(search)}" placeholder="ابحث في المخزون..."></label>
				</div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>المادة</th><th>دخول</th><th>خروج</th><th>الرصيد الحالي</th><th>حد التنبيه</th><th>قيمة الرصيد</th><th>سعر FEX</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('المخزون فارغ', 'أضف مواد وسجّل التوريد.')}
			</section>
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>سجل الحركات الأخيرة</h2><div class="panel-subtitle">آخر الحركات المسجلة</div></div>
					<label class="search-field">${icon('search')}<input id="movementSearch" type="search" value="${esc(movementSearch)}" placeholder="ابحث في الحركات..."></label>
				</div>
				${movementRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>التاريخ</th><th>المادة</th><th>الحركة</th><th>الكمية</th><th>تكلفة الوحدة</th><th>الإجمالي</th><th>البيان</th><th>حذف</th></tr></thead><tbody>${movementRows}</tbody></table></div>` : emptyState('لا توجد حركات', 'ستظهر حركات الدخول والخروج هنا.')}
			</section>
		`;
		refreshIcons();
	}

	// 3.5. Purchase Orders View (طلب مواد من المورّد)
	function renderPurchaseOrders(search = '') {
		setHeader('purchaseOrders');
		const term = search.trim().toLowerCase();
		const orders = state.purchaseOrders || [];
		const matching = orders.filter(o => `${o.number} ${o.supplier} ${o.date} ${o.phone}`.toLowerCase().includes(term));
		const lowMaterials = state.materials.filter(lowStock);

		const rows = matching.map(o => {
			const itemsSummary = (o.items || []).map(i => `${i.name} (${quantity(i.quantity)} ${i.unit})`).join('، ');
			const isSent = o.status === 'sent';
			const isReceived = o.status === 'received';
			const badgeClass = isReceived ? 'badge-ok' : isSent ? 'badge-in' : 'badge-low';
			const statusLabel = isReceived ? 'تم الاستلام' : isSent ? 'تم الإرسال (WhatsApp)' : 'معلقة';

			return `
				<tr>
					<td><strong>${esc(o.number)}</strong><div class="item-sub">${esc(o.date)}</div></td>
					<td><span class="item-main">${esc(o.supplier)}</span><div class="item-sub" dir="ltr">${esc(o.phone || '—')}</div></td>
					<td style="max-width:280px;white-space:normal;"><div class="item-sub" style="font-size:11px;line-height:1.4;">${esc(itemsSummary || '—')}</div></td>
					<td><strong>${money(o.totalEstimated || 0)}</strong></td>
					<td><span class="badge ${badgeClass}">${statusLabel}</span></td>
					<td>
						<div class="toolbar-actions">
							<button class="icon-button" data-order-whatsapp="${esc(o.id)}" title="إرسال عبر WhatsApp" style="color:#25D366;"><i data-lucide="message-circle"></i></button>
							<button class="icon-button" data-order-pdf="${esc(o.id)}" title="تنزيل PDF / طباعة أمر الشراء" style="color:#0284c7;"><i data-lucide="printer"></i></button>
							<button class="icon-button" data-order-to-invoice="${esc(o.id)}" title="تحويل لفاتورة توريد (تحديث المخزون)" style="color:#059669;"><i data-lucide="package-check"></i></button>
							<button class="icon-button" data-delete-order="${esc(o.id)}" title="حذف الطلبية"><i data-lucide="trash-2"></i></button>
						</div>
					</td>
				</tr>
			`;
		}).join('');

		const metrics = [
			{
				label: 'إجمالي الطلبيات',
				value: orders.length,
				note: 'طلبية مسجلة',
				icon: 'shopping-cart',
				themeClass: 'card-po-orders'
			},
			{
				label: 'مواد تحتاج التوريد',
				value: lowMaterials.length,
				note: lowMaterials.length ? 'تحت حد الأمان الأدنى' : 'المخزون كافٍ ومستقر',
				icon: 'triangle-alert',
				themeClass: 'card-po-alerts'
			},
			{
				label: 'إجمالي المورّدين',
				value: state.suppliers.length,
				note: 'مورّد متاح ومعتمد',
				icon: 'truck',
				themeClass: 'card-po-suppliers'
			},
			{
				label: 'قيمة آخر الطلبيات',
				value: orders.length ? money(orders[0].totalEstimated || 0) : '0 د.م.',
				note: orders.length ? orders[0].date : 'لا توجد طلبيات مسجلة',
				icon: 'receipt',
				themeClass: 'card-po-value'
			}
		];

		const metricCards = metrics.map(m => `
			<article class="metric-card-styled ${m.themeClass}">
				<div class="metric-card-header">
					<span class="metric-card-title">${m.label}</span>
					<span class="metric-card-icon">${icon(m.icon)}</span>
				</div>
				<div class="metric-card-value">${m.value}</div>
				<div class="metric-card-note">${m.note}</div>
			</article>
		`).join('');

		viewContent.innerHTML = `
			<div class="metric-grid">${metricCards}</div>
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>سجل طلبيات التوريد للموردين (Bons de Commande)</h2><div class="panel-subtitle">إرسال فوري عبر WhatsApp مع رسالة مجهزة وتنزيل كملف PDF</div></div>
					<div class="toolbar-actions">
						<label class="search-field">${icon('search')}<input id="purchaseOrderSearch" type="search" value="${esc(search)}" placeholder="ابحث برقم الطلبية أو المورد..."></label>
						<button class="button button-primary" id="openNewOrderBtn">${icon('plus')}إنشاء طلبية جديدة</button>
						${lowMaterials.length ? `<button class="button button-secondary" id="quickOrderAllLowStockBtn" style="background:#eef6f3;color:#0e5a44;border-color:#b9dfcf;">${icon('sparkles')}طلب المواد الناقصة (${lowMaterials.length})</button>` : ''}
					</div>
				</div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>رقم الطلبية والتاريخ</th><th>المورّد والهاتف</th><th>المواد المطلوبة</th><th>الإجمالي التقديري</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('لا توجد طلبيات توريد مسجلة', 'انقر على "إنشاء طلبية جديدة" لاختيار المورد والمواد وإرسالها عبر WhatsApp أو تنزيلها بصيغة PDF.')}
			</section>
		`;
		refreshIcons();
	}

	function openPurchaseOrderDialog(orderId = null, prefillSupplierId = null, prefillItems = null) {
		const dlg = document.getElementById('purchaseOrderDialog');
		const form = document.getElementById('purchaseOrderForm');
		if (!dlg || !form) return;
		form.reset();

		const supplierSelect = document.getElementById('poSupplierSelect');
		supplierSelect.innerHTML = `<option value="">اختر المورّد...</option>` + state.suppliers.map(s => `
			<option value="${esc(s.name)}" data-phone="${esc(s.phone || '')}" ${prefillSupplierId && (s.id === prefillSupplierId || s.name === prefillSupplierId) ? 'selected' : ''}>${esc(s.name)} ${s.phone ? `(${s.phone})` : ''}</option>
		`).join('');

		const todayStr = today();
		form.elements.id.value = orderId || '';
		form.elements.date.value = todayStr;
		form.elements.number.value = 'BC-' + todayStr.replace(/-/g, '') + '-' + ((state.purchaseOrders || []).length + 1).toString().padStart(2, '0');

		const phoneInput = document.getElementById('poSupplierPhone');
		if (prefillSupplierId) {
			const sup = state.suppliers.find(s => s.id === prefillSupplierId || s.name === prefillSupplierId);
			if (sup && sup.phone) phoneInput.value = sup.phone;
		}

		supplierSelect.onchange = () => {
			const selOpt = supplierSelect.selectedOptions[0];
			if (selOpt && selOpt.dataset.phone) {
				phoneInput.value = selOpt.dataset.phone;
			}
		};

		const container = document.getElementById('poLines');
		container.innerHTML = '';

		if (prefillItems && prefillItems.length) {
			prefillItems.forEach(it => addPurchaseOrderLine(it.materialId, it.quantity, it.unit, it.price));
		} else {
			addPurchaseOrderLine();
		}

		updatePurchaseOrderTotalsInDialog();
		dlg.showModal();
		refreshIcons();
	}

	function addPurchaseOrderLine(matId = '', qty = 1, unit = 'kg', price = 0) {
		const container = document.getElementById('poLines');
		if (!container) return;
		const line = document.createElement('div');
		line.className = 'invoice-line';

		const selectedMat = matId ? state.materials.find(m => m.id === matId) : null;
		const initialPrice = price || (selectedMat ? Number(selectedMat.cost) || 0 : 0);
		const initialUnit = unit || (selectedMat ? selectedMat.unit : 'kg');

		line.innerHTML = `
			<label class="field">المادة<select data-po-line-material required><option value="">اختر مادة...</option>${state.materials.map(m => `<option value="${esc(m.id)}" data-unit="${esc(m.unit)}" data-cost="${esc(m.cost || 0)}" ${m.id === matId ? 'selected' : ''}>${esc(m.name)} (رصيد: ${quantity(m.quantity)} ${esc(m.unit)})</option>`).join('')}</select></label>
			<label class="field">الكمية المطلوبة<input data-po-line-qty type="number" min="0.01" step="0.01" value="${qty || 1}" required></label>
			<label class="field">الوحدة<input data-po-line-unit type="text" value="${esc(initialUnit)}" required placeholder="kg أو pc"></label>
			<label class="field">سعر الوحدة التقديري<input data-po-line-cost type="number" min="0" step="0.01" value="${initialPrice}"></label>
			<button class="icon-button" type="button" data-remove-line title="حذف السطر">${icon('x')}</button>
		`;

		const sel = line.querySelector('[data-po-line-material]');
		sel.onchange = () => {
			const opt = sel.selectedOptions[0];
			if (opt) {
				if (opt.dataset.unit) line.querySelector('[data-po-line-unit]').value = opt.dataset.unit;
				if (opt.dataset.cost) line.querySelector('[data-po-line-cost]').value = opt.dataset.cost;
				updatePurchaseOrderTotalsInDialog();
			}
		};

		container.appendChild(line);
		refreshIcons();
		updatePurchaseOrderTotalsInDialog();
	}

	function updatePurchaseOrderTotalsInDialog() {
		const lines = [...document.querySelectorAll('#poLines .invoice-line')];
		let total = 0;
		lines.forEach(l => {
			const qty = Number(l.querySelector('[data-po-line-qty]')?.value) || 0;
			const cost = Number(l.querySelector('[data-po-line-cost]')?.value) || 0;
			total += qty * cost;
		});

		const countEl = document.getElementById('poItemCount');
		const totEl = document.getElementById('poEstimatedTotal');
		if (countEl) countEl.textContent = `${lines.length} مواد`;
		if (totEl) totEl.textContent = money(total);
	}

	function sendPurchaseOrderWhatsapp(order) {
		const phone = String(order.phone || '').replace(/\D/g, '');
		if (!phone) { toast('رقم هاتف المورّد غير متوفر أو غير صالح'); return; }

		let text = `*طلب مواد وتوريد - مطعم OBAYOLI* 🍽️\n`;
		text += `------------------------------------\n`;
		text += `📋 *رقم الطلبية:* ${order.number}\n`;
		text += `📅 *التاريخ:* ${order.date}\n`;
		text += `🏢 *المورّد:* ${order.supplier}\n\n`;
		text += `📦 *المواد والكميات المطلوبة:*\n`;

		(order.items || []).forEach((item, idx) => {
			text += `${idx + 1}. *${item.name}*: ${quantity(item.quantity)} ${item.unit}\n`;
		});

		if (order.totalEstimated > 0) {
			text += `\n💰 *المجموع التقديري:* ${money(order.totalEstimated)}\n`;
		}

		if (order.notes) {
			text += `\n📝 *ملاحظات وشروط التسليم:* ${order.notes}\n`;
		}

		text += `------------------------------------\n`;
		text += `شكراً لتعاونكم، إدارة مطعم OBAYOLI.`;

		order.status = 'sent';
		saveState();

		const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
		window.open(url, '_blank');
		toast('تم فتح WhatsApp لإرسال الطلبية بنجاح!');
		render(viewContent.dataset.view);
	}

	function printHtmlDocument(html) {
		let iframe = document.getElementById('printFrame');
		if (!iframe) {
			iframe = document.createElement('iframe');
			iframe.id = 'printFrame';
			iframe.style.position = 'fixed';
			iframe.style.right = '0';
			iframe.style.bottom = '0';
			iframe.style.width = '0';
			iframe.style.height = '0';
			iframe.style.border = 'none';
			iframe.style.visibility = 'hidden';
			document.body.appendChild(iframe);
		}
		const doc = iframe.contentWindow.document;
		doc.open();
		doc.write(html);
		doc.close();
		setTimeout(() => {
			try {
				iframe.contentWindow.focus();
				iframe.contentWindow.print();
			} catch (e) {
				const w = window.open('', '_blank');
				if (w) {
					w.document.open();
					w.document.write(html);
					w.document.close();
					w.print();
				}
			}
		}, 300);
	}

	function printPurchaseOrderPdf(order) {
		const itemsRows = (order.items || []).map((it, idx) => `
			<tr>
				<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
				<td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${esc(it.name)}</td>
				<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">${quantity(it.quantity)}</td>
				<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${esc(it.unit)}</td>
				<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${money(it.price || 0)}</td>
				<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;font-weight:700;">${money((Number(it.quantity) || 0) * (Number(it.price) || 0))}</td>
			</tr>
		`).join('');

		const html = `<!DOCTYPE html>
			<html lang="ar" dir="rtl">
			<head>
				<meta charset="utf-8">
				<title>أمر شراء - ${esc(order.number)}</title>
				<style>
					body { font-family: 'IBM Plex Sans Arabic', Tahoma, sans-serif; padding: 30px; color: #1e293b; direction: rtl; }
					.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #113830; padding-bottom: 15px; margin-bottom: 25px; }
					.brand-title { font-size: 26px; font-weight: 800; color: #113830; }
					.badge { display: inline-block; padding: 4px 10px; background: #e8f3ee; color: #113830; border-radius: 4px; font-weight: 700; font-size: 13px; }
					.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
					.info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
					.info-box h3 { margin: 0 0 8px; font-size: 14px; color: #113830; }
					.info-box p { margin: 4px 0; font-size: 13px; color: #475569; }
					table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
					th { background: #113830; color: #fff; padding: 10px; font-size: 12px; }
					.total-box { text-align: left; margin-bottom: 35px; }
					.total-box strong { font-size: 18px; color: #113830; background: #f1f5f9; padding: 8px 16px; border-radius: 6px; }
					.footer { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
					.sig-box { width: 220px; text-align: center; }
					.sig-line { margin-top: 50px; border-top: 1px solid #94a3b8; }
					@media print { button { display: none; } body { padding: 0; } }
				</style>
			</head>
			<body>
				<div class="header">
					<div>
						<div class="brand-title">OBAYOLI</div>
						<div style="font-size:12px;color:#64748b;">إدارة المطاعم والمخزون • أمر شراء مواد</div>
					</div>
					<div style="text-align:left;">
						<div class="badge">BON DE COMMANDE</div>
						<div style="font-size:14px;font-weight:700;margin-top:6px;">${esc(order.number)}</div>
					</div>
				</div>

				<div class="info-grid">
					<div class="info-box">
						<h3>بيانات المورّد (Fournisseur):</h3>
						<p><strong>الاسم:</strong> ${esc(order.supplier)}</p>
						<p><strong>الهاتف:</strong> ${esc(order.phone || '—')}</p>
					</div>
					<div class="info-box">
						<h3>تفاصيل الطلبية (Détails):</h3>
						<p><strong>تاريخ الطلبية:</strong> ${esc(order.date)}</p>
						<p><strong>الحالة:</strong> ${esc(order.status === 'sent' ? 'تم الإرسال للمورّد' : 'طلبية معتمدة')}</p>
					</div>
				</div>

				<table>
					<thead>
						<tr>
							<th style="width:40px;">#</th>
							<th style="text-align:right;">المادة المطلوبة (Désignation)</th>
							<th>الكمية</th>
							<th>الوحدة</th>
							<th>السعر التقديري</th>
							<th style="text-align:left;">الإجمالي HT</th>
						</tr>
					</thead>
					<tbody>
						${itemsRows}
					</tbody>
				</table>

				<div class="total-box">
					<span>المجموع الإجمالي التقديري: </span>
					<strong>${money(order.totalEstimated || 0)}</strong>
				</div>

				${order.notes ? `<div style="background:#fffbeb;border:1px solid #fef3c7;padding:12px;border-radius:6px;margin-bottom:25px;font-size:12px;color:#92400e;"><strong>ملاحظات وشروط التوصيل:</strong> ${esc(order.notes)}</div>` : ''}

				<div class="footer">
					<div class="sig-box">
						<span style="font-size:13px;font-weight:700;">توقيع وخاتم المورّد</span>
						<div class="sig-line"></div>
					</div>
					<div class="sig-box">
						<span style="font-size:13px;font-weight:700;">توقيع إدارة مطعم OBAYOLI</span>
						<div class="sig-line"></div>
					</div>
				</div>
			</body>
			</html>`;

		printHtmlDocument(html);
		toast('تم فتح أمر الشراء لتنزيله كملف PDF أو طباعته');
	}

	function convertPurchaseOrderToInvoice(order) {
		openDialog('invoiceDialog');
		const form = document.getElementById('invoiceForm');
		if (!form) return;
		form.elements.supplier.value = order.supplier;
		form.elements.number.value = 'INV-' + order.number.replace('BC-', '');
		form.elements.date.value = today();

		const container = document.getElementById('invoiceLines');
		container.innerHTML = '';
		(order.items || []).forEach(item => {
			const line = document.createElement('div');
			line.className = 'invoice-line';
			line.innerHTML = `
				<label class="field">المادة<select data-line-material required>${state.materials.map(m => `<option value="${esc(m.id)}" ${m.id === item.materialId ? 'selected' : ''}>${esc(m.name)} (${esc(m.unit)})</option>`).join('')}</select></label>
				<label class="field">الكمية<input data-line-quantity type="number" min="0.01" step="0.01" value="${item.quantity}" required></label>
				<label class="field">سعر الوحدة HT<input data-line-cost type="number" min="0" step="0.01" value="${item.price || 0}" required></label>
				<label class="field">TVA %<input data-line-vat type="number" min="0" max="100" step="1" value="20"></label>
				<button class="icon-button" type="button" data-remove-line title="حذف السطر">${icon('x')}</button>
			`;
			container.appendChild(line);
		});
		refreshIcons();
		updateInvoiceTotalsInDialog();
		order.status = 'received';
		saveState();
		toast('تم تحويل الطلبية إلى فاتورة توريد. تأكد من المبالغ واضغط حفظ لتحديث المخزون!');
	}

	// 4. Waste View
	function renderWaste() {
		setHeader('waste');
		const wasteMovements = state.movements.filter(m => m.type === 'waste');
		const totalQty = wasteMovements.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
		const totalVal = wasteMovements.reduce((sum, m) => sum + Number(m.quantity || 0) * (Number(m.cost) || 0), 0);

		const matOptions = state.materials.map(m => `<option value="${esc(m.id)}">${esc(m.name)} (${quantity(m.quantity)} ${esc(m.unit)} متاح)</option>`).join('');

		const rows = wasteMovements.slice(0, 25).map(m => `
			<tr>
				<td>${esc(m.date)}</td>
				<td><span class="item-main">${esc(m.materialName)}</span></td>
				<td>${quantity(m.quantity)} ${esc(m.unit)}</td>
				<td>${money(m.cost)}</td>
				<td>${money(Number(m.quantity) * Number(m.cost))}</td>
				<td>${esc(m.note || 'تالف أو هدر')}</td>
				<td><button class="icon-button" data-delete-movement="${esc(m.id)}" title="حذف واسترجاع الرصيد">${icon('trash-2')}</button></td>
			</tr>
		`).join('');

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head"><div><h2>تسجيل الهدر والتالف</h2><div class="panel-subtitle">خصم الكميات التالفة وتوثيق الأسباب</div></div></div>
				<form id="wasteForm" class="panel-body">
					<div class="form-grid">
						<label class="field">المادة<select name="materialId" required ${state.materials.length ? '' : 'disabled'}><option value="">اختر مادة...</option>${matOptions}</select></label>
						<label class="field">كمية الهدر<input name="quantity" type="number" min="0.01" step="0.01" required></label>
						<label class="field">تاريخ الهدر<input name="date" type="date" value="${esc(today())}" required></label>
						<label class="field full-span">سبب الهدر<input name="note" maxlength="140" required placeholder="مثال: انتهاء الصلاحية أو تلف أثناء التخزين"></label>
					</div>
					<div class="dialog-actions"><button class="button button-primary" type="submit">${icon('trash-2')}تسجيل الهدر</button></div>
				</form>
			</section>
			<div class="metric-grid">
				<article class="metric alert"><div class="metric-top"><span>إجمالي كمية الهدر</span><span class="metric-icon">${icon('trash-2')}</span></div><div class="metric-value">${quantity(totalQty)}</div><div class="metric-note">كمية تراكمية</div></article>
				<article class="metric alert"><div class="metric-top"><span>قيمة الهدر المالية</span><span class="metric-icon">${icon('coins')}</span></div><div class="metric-value">${money(totalVal)}</div><div class="metric-note">بحسب تكلفة الشراء</div></article>
			</div>
			<section class="panel">
				<div class="panel-head"><h2>سجل الهدر والتالف</h2></div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>التاريخ</th><th>المادة</th><th>الكمية</th><th>تكلفة الوحدة</th><th>قيمة الهدر</th><th>السبب</th><th>إجراء</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('لا يوجد هدر مسجل', 'استخدم النموذج أعلاه لتوثيق الهدر.')}
			</section>
		`;
		refreshIcons();
	}

	// 5. Consumption View
	function renderConsumption() {
		setHeader('consumption', `<button class="button button-secondary" data-open-dialog="materialDialog">${icon('plus')}إضافة مادة</button>`);
		const matOptions = state.materials.map(m => `<option value="${esc(m.id)}">${esc(m.name)} (${quantity(m.quantity)} ${esc(m.unit)} متاح)</option>`).join('');

		const deptMovements = state.movements.filter(m => m.type === 'out' && ['cuisine', 'bar'].includes(m.department));
		const kitchenTotal = deptMovements.filter(m => m.department === 'cuisine').reduce((sum, m) => sum + Number(m.quantity) * Number(m.cost), 0);
		const barTotal = deptMovements.filter(m => m.department === 'bar').reduce((sum, m) => sum + Number(m.quantity) * Number(m.cost), 0);

		const rows = deptMovements.slice(0, 20).map(m => `
			<tr>
				<td>${esc(m.date)}</td>
				<td><span class="item-main">${esc(m.materialName)}</span></td>
				<td><span class="badge badge-ok">${m.department === 'bar' ? 'البار (Bar)' : 'المطبخ (Cuisine)'}</span></td>
				<td>${quantity(m.quantity)} ${esc(m.unit)}</td>
				<td>${money(m.cost)}</td>
				<td>${money(Number(m.quantity) * Number(m.cost))}</td>
				<td>${esc(m.note || 'استهلاك')}</td>
				<td><button class="icon-button" data-delete-movement="${esc(m.id)}" title="حذف الصرف">${icon('trash-2')}</button></td>
			</tr>
		`).join('');

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head"><div><h2>صرف مواد للاستهلاك اليومي</h2><div class="panel-subtitle">تخصم الكميات من المخزون لحساب المطبخ أو البار</div></div></div>
				<form id="consumptionForm" class="panel-body">
					<div class="form-grid">
						<label class="field">المادة<select name="materialId" required ${state.materials.length ? '' : 'disabled'}><option value="">اختر مادة...</option>${matOptions}</select></label>
						<label class="field">جهة الاستهلاك<select name="department" required><option value="cuisine">المطبخ (Cuisine)</option><option value="bar">البار (Bar)</option></select></label>
						<label class="field">الكمية المصروفة<input name="quantity" type="number" min="0.01" step="0.01" required></label>
						<label class="field">تاريخ الصرف<input name="date" type="date" value="${esc(today())}" required></label>
						<label class="field full-span">البيان / ملاحظة<input name="note" maxlength="140" placeholder="مثال: تحضير وجبة الغداء"></label>
					</div>
					<div class="dialog-actions"><button class="button button-primary" type="submit">${icon('package-minus')}تأكيد الصرف</button></div>
				</form>
			</section>
			<div class="metric-grid">
				<article class="metric"><div class="metric-top"><span>استهلاك المطبخ</span><span class="metric-icon">${icon('utensils')}</span></div><div class="metric-value">${money(kitchenTotal)}</div><div class="metric-note">إجمالي المصروف</div></article>
				<article class="metric"><div class="metric-top"><span>استهلاك البار</span><span class="metric-icon">${icon('cup-soda')}</span></div><div class="metric-value">${money(barTotal)}</div><div class="metric-note">إجمالي المصروف</div></article>
				<article class="metric"><div class="metric-top"><span>إجمالي الاستهلاك</span><span class="metric-icon">${icon('coins')}</span></div><div class="metric-value">${money(kitchenTotal + barTotal)}</div><div class="metric-note">المطبخ + البار</div></article>
			</div>
			<section class="panel">
				<div class="panel-head"><h2>سجل عمليات الصرف</h2></div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>التاريخ</th><th>المادة</th><th>الجهة</th><th>الكمية</th><th>تكلفة الوحدة</th><th>الإجمالي</th><th>البيان</th><th>حذف</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('لا توجد عمليات صرف', 'سجّل صرف المواد للمطبخ أو البار.')}
			</section>
		`;
		refreshIcons();
	}

	// 6. Technical Sheets View (Fiche technique)
	function calculateTechnicalSheetCost(sheetId, ancestors = new Set()) {
		if (ancestors.has(sheetId)) return null;
		const sheet = state.technicalSheets.find(s => s.id === sheetId);
		if (!sheet || !Array.isArray(sheet.lines) || !sheet.lines.length) return null;
		const nextAncestors = new Set(ancestors).add(sheetId);
		let total = 0;
		for (const line of sheet.lines) {
			const qty = Number(line.quantity) || 0;
			if (qty <= 0) return null;
			if (line.type === 'technicalSheet' || line.technicalSheetId) {
				const childId = line.technicalSheetId || line.itemId;
				const child = state.technicalSheets.find(s => s.id === childId);
				const childCost = calculateTechnicalSheetCost(childId, nextAncestors);
				if (!child || childCost === null) return null;
				total += qty * (childCost / Math.max(1, Number(child.yield) || 1));
			} else {
				const matId = line.materialId || line.itemId;
				const mat = state.materials.find(m => String(m.id) === String(matId));
				if (!mat) return null;
				total += qty * (Number(mat.cost) || 0);
			}
		}
		return total;
	}

	function renderTechnicalSheets(search = '') {
		setHeader('technicalSheets', `<button class="button button-primary" data-open-dialog="technicalSheetDialog">${icon('plus')}إضافة Fiche Technique</button>`);
		const term = search.trim().toLowerCase();
		const matching = state.technicalSheets.filter(s => `${s.name} ${s.category} ${s.notes}`.toLowerCase().includes(term));

		const cards = matching.map(s => {
			const yieldCount = Math.max(1, Number(s.yield) || 1);
			const totalCost = calculateTechnicalSheetCost(s.id);
			const costPerPortion = totalCost !== null ? totalCost / yieldCount : null;
			const sellingPrice = Number(s.sellingPrice) || 0;

			const lineItems = (s.lines || []).map(l => {
				const isSheet = l.type === 'technicalSheet' || l.technicalSheetId;
				const childSheet = isSheet ? state.technicalSheets.find(x => x.id === (l.technicalSheetId || l.itemId)) : null;
				const mat = !isSheet ? state.materials.find(x => String(x.id) === String(l.materialId || l.itemId)) : null;
				const name = childSheet ? childSheet.name : (mat ? mat.name : 'مكوّن محذوف');
				const u = childSheet ? 'وحدة' : (mat ? mat.unit : '');
				return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f4f2;font-size:12px;"><span>${esc(name)}</span><strong>${quantity(l.quantity)} ${esc(u)}</strong></div>`;
			}).join('');

			return `
				<article class="recipe-card">
					<header class="recipe-card-head">
						<div><h3 class="recipe-title">${esc(s.name)}</h3><div class="item-sub">${esc(s.category || 'طبق')} · ${s.department === 'bar' ? 'البار' : 'المطبخ'}</div></div>
						<div class="toolbar-actions">
							<button class="icon-button" data-edit-technical="${esc(s.id)}" title="تعديل">${icon('pencil')}</button>
							<button class="icon-button" data-delete-technical="${esc(s.id)}" title="حذف">${icon('trash-2')}</button>
						</div>
					</header>
					<div class="recipe-card-body">
						<div class="recipe-stats">
							<div class="recipe-stat"><span>الحصص</span><strong>${yieldCount}</strong></div>
							<div class="recipe-stat"><span>تكلفة الحصة</span><strong>${costPerPortion !== null ? money(costPerPortion) : 'غير مكتملة'}</strong></div>
							<div class="recipe-stat"><span>سعر البيع</span><strong>${sellingPrice ? money(sellingPrice) : '—'}</strong></div>
							<div class="recipe-stat"><span>هامش الربح</span><strong style="color:var(--green)">${(sellingPrice && costPerPortion !== null) ? money(sellingPrice - costPerPortion) : '—'}</strong></div>
						</div>
						<div style="margin-top:10px;">
							<h4 style="margin:0 0 6px;font-size:12px;color:var(--green-dark);">المكونات:</h4>
							${lineItems || '<p class="item-sub">لا توجد مكونات بعد</p>'}
						</div>
						${s.preparation ? `<div style="margin-top:10px;"><h4 style="margin:0 0 6px;font-size:12px;color:var(--green-dark);">طريقة التحضير:</h4><p style="margin:0;font-size:11px;color:var(--ink);white-space:pre-line;">${esc(s.preparation)}</p></div>` : ''}
					</div>
				</article>
			`;
		}).join('');

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>البطاقات التقنية للأطباق والمخبوزات</h2><div class="panel-subtitle">${state.technicalSheets.length} بطاقة مسجلة مع حساب التكلفة التلقائي</div></div>
					<label class="search-field">${icon('search')}<input id="technicalSheetSearch" type="search" value="${esc(search)}" placeholder="ابحث في البطاقات التقنية..."></label>
				</div>
				<div class="panel-body">
					${cards ? `<div class="recipe-grid">${cards}</div>` : emptyState('لا توجد بطاقات أطباق', 'أنشئ بطاقة Fiche technique لتوثيق المقادير والتكاليف.')}
				</div>
			</section>
		`;
		refreshIcons();
	}

	// 7. Dish Sales View
	function renderDishSales() {
		setHeader('dishSales', `<button class="button button-primary" data-open-dialog="dishSaleDialog">${icon('plus')}تسجيل بيع طبق</button>`);
		const salesRows = state.dishSales.slice(0, 30).map(sale => `
			<tr>
				<td>${esc(sale.date)}</td>
				<td><strong>${esc(sale.dishName)}</strong></td>
				<td>${quantity(sale.quantity)} طبق</td>
				<td>${sale.department === 'bar' ? 'البار (Bar)' : 'المطبخ (Cuisine)'}</td>
				<td>${esc(sale.note || '—')}</td>
			</tr>
		`).join('');

		const totalDishes = state.dishSales.reduce((sum, s) => sum + Number(s.quantity), 0);

		viewContent.innerHTML = `
			<div class="metric-grid">
				<article class="metric"><div class="metric-top"><span>إجمالي الأطباق المباعة</span><span class="metric-icon">${icon('shopping-bag')}</span></div><div class="metric-value">${quantity(totalDishes)}</div><div class="metric-note">كل المبيعات المسجلة</div></article>
				<article class="metric"><div class="metric-top"><span>عدد عمليات البيع</span><span class="metric-icon">${icon('receipt')}</span></div><div class="metric-value">${state.dishSales.length}</div><div class="metric-note">عملية مسجلة</div></article>
			</div>
			<section class="panel">
				<div class="panel-head"><div><h2>سجل مبيعات الأطباق</h2><div class="panel-subtitle">كل عملية تخصم المكونات آلياً من المخزون</div></div></div>
				${salesRows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>التاريخ</th><th>الطبق</th><th>الكمية</th><th>الجهة</th><th>ملاحظة</th></tr></thead><tbody>${salesRows}</tbody></table></div>` : emptyState('لا توجد مبيعات مسجلة', 'سجّل عملية بيع لطبق وستُخصم مكوناته تلقائياً.')}
			</section>
		`;
		refreshIcons();
	}

	// 8. Invoices View
	function getInvoiceTotals(lines, defaultVat = 20) {
		let subtotal = 0, vatAmount = 0;
		(lines || []).forEach(l => {
			const st = Math.round(Number(l.quantity) * Number(l.unitCost) * 100) / 100;
			const rate = (l.vatRate !== '' && l.vatRate !== null && !isNaN(Number(l.vatRate))) ? Number(l.vatRate) : defaultVat;
			const vat = Math.round(st * rate) / 100;
			subtotal += st;
			vatAmount += vat;
		});
		return { subtotal, vatAmount, total: subtotal + vatAmount };
	}

	function openInvoiceDetailDialog(invId) {
		const inv = state.invoices.find(i => i.id === invId);
		if (!inv) return;
		const dlg = document.getElementById('invoiceDetailDialog');
		if (!dlg) return;

		const totals = getInvoiceTotals(inv.lines, inv.vatRate || 20);
		const linesHtml = (inv.lines || []).map((l, idx) => {
			const mat = state.materials.find(m => m.id === l.materialId);
			const st = (Number(l.quantity) || 0) * (Number(l.unitCost) || 0);
			return `
				<tr>
					<td style="text-align:center;">${idx + 1}</td>
					<td><strong>${esc(mat ? mat.name : 'مادة')}</strong> <small class="item-sub">(${esc(mat ? mat.unit : '')})</small></td>
					<td style="text-align:center;font-weight:700;">${quantity(l.quantity)}</td>
					<td style="text-align:center;">${money(l.unitCost)}</td>
					<td style="text-align:center;">${l.vatRate !== undefined ? l.vatRate : 20}%</td>
					<td style="text-align:left;font-weight:700;">${money(st)}</td>
				</tr>
			`;
		}).join('');

		document.getElementById('invoiceDetailTitle').textContent = `فاتورة توريد: ${inv.number || 'بدون رقم'}`;
		document.getElementById('invoiceDetailContent').innerHTML = `
			<div class="info-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
				<div class="info-box" style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">
					<div style="font-size:12px;color:var(--muted);">المورّد</div>
					<strong style="font-size:14px;color:var(--ink);">${esc(inv.supplier)}</strong>
				</div>
				<div class="info-box" style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">
					<div style="font-size:12px;color:var(--muted);">تاريخ الفاتورة</div>
					<strong style="font-size:14px;color:var(--ink);">${esc(inv.date)}</strong>
				</div>
			</div>
			<div class="table-wrap">
				<table class="data-table">
					<thead><tr><th style="width:40px;">#</th><th>المادة</th><th>الكمية</th><th>سعر الوحدة HT</th><th>TVA</th><th>المجموع HT</th></tr></thead>
					<tbody>${linesHtml}</tbody>
				</table>
			</div>
			<div class="invoice-total" style="margin-top:16px;">
				<div class="invoice-amount-row"><span>المجموع HT:</span><strong>${money(totals.subtotal)}</strong></div>
				<div class="invoice-amount-row"><span>ضريبة القيمة المضافة TVA:</span><strong>${money(totals.vatAmount)}</strong></div>
				<div class="invoice-amount-row invoice-grand-total"><span>المجموع الإجمالي TTC:</span><strong>${money(totals.total)}</strong></div>
			</div>
		`;

		const printBtn = document.getElementById('printInvoiceDetailBtn');
		if (printBtn) {
			printBtn.onclick = () => printInvoicePdf(inv);
		}

		dlg.showModal();
		refreshIcons();
	}

	function printInvoicePdf(inv) {
		const totals = getInvoiceTotals(inv.lines, inv.vatRate || 20);
		const linesHtml = (inv.lines || []).map((l, idx) => {
			const mat = state.materials.find(m => m.id === l.materialId);
			const st = (Number(l.quantity) || 0) * (Number(l.unitCost) || 0);
			return `
				<tr>
					<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
					<td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:600;">${esc(mat ? mat.name : 'مادة')}</td>
					<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">${quantity(l.quantity)} ${esc(mat ? mat.unit : '')}</td>
					<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${money(l.unitCost)}</td>
					<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${l.vatRate !== undefined ? l.vatRate : 20}%</td>
					<td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;font-weight:700;">${money(st)}</td>
				</tr>
			`;
		}).join('');

		const html = `<!DOCTYPE html>
			<html lang="ar" dir="rtl">
			<head>
				<meta charset="utf-8">
				<title>فاتورة توريد - ${esc(inv.number || 'FA')}</title>
				<style>
					body { font-family: 'IBM Plex Sans Arabic', Tahoma, sans-serif; padding: 30px; color: #1e293b; direction: rtl; }
					.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #113830; padding-bottom: 15px; margin-bottom: 25px; }
					.brand-title { font-size: 26px; font-weight: 800; color: #113830; }
					.badge { display: inline-block; padding: 4px 10px; background: #e8f3ee; color: #113830; border-radius: 4px; font-weight: 700; font-size: 13px; }
					.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
					.info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
					.info-box h3 { margin: 0 0 8px; font-size: 14px; color: #113830; }
					.info-box p { margin: 4px 0; font-size: 13px; color: #475569; }
					table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
					th { background: #113830; color: #fff; padding: 10px; font-size: 12px; }
					.total-box { margin-bottom: 35px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; }
					.total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
					.grand-row { border-top: 2px solid #113830; padding-top: 8px; font-size: 18px; font-weight: 800; color: #113830; }
					@media print { button { display: none; } body { padding: 0; } }
				</style>
			</head>
			<body>
				<div class="header">
					<div><div class="brand-title">OBAYOLI</div><div style="font-size:12px;color:#64748b;">إدارة المطاعم والمخزون • فاتورة توريد مواد</div></div>
					<div style="text-align:left;"><div class="badge">FACTURE FOURNISSEUR</div><div style="font-size:14px;font-weight:700;margin-top:6px;">${esc(inv.number)}</div></div>
				</div>
				<div class="info-grid">
					<div class="info-box"><h3>بيانات المورّد:</h3><p><strong>الاسم:</strong> ${esc(inv.supplier)}</p></div>
					<div class="info-box"><h3>تفاصيل الفاتورة:</h3><p><strong>التاريخ:</strong> ${esc(inv.date)}</p><p><strong>رقم الفاتورة:</strong> ${esc(inv.number)}</p></div>
				</div>
				<table>
					<thead><tr><th style="width:40px;">#</th><th style="text-align:right;">المادة</th><th>الكمية</th><th>سعر الوحدة HT</th><th>TVA</th><th style="text-align:left;">المجموع HT</th></tr></thead>
					<tbody>${linesHtml}</tbody>
				</table>
				<div class="total-box">
					<div class="total-row"><span>المجموع HT:</span><strong>${money(totals.subtotal)}</strong></div>
					<div class="total-row"><span>ضريبة القيمة المضافة TVA:</span><strong>${money(totals.vatAmount)}</strong></div>
					<div class="total-row grand-row"><span>الإجمالي TTC:</span><strong>${money(totals.total)}</strong></div>
				</div>
			</body>
			</html>`;

		printHtmlDocument(html);
	}

	function renderInvoices(search = '') {
		setHeader('invoices', `<button class="button button-primary" data-open-dialog="invoiceDialog">${icon('plus')}تسجيل فاتورة</button>`);
		const term = search.trim().toLowerCase();
		const matching = state.invoices.filter(inv => `${inv.number} ${inv.supplier} ${inv.date}`.toLowerCase().includes(term));

		const rows = matching.map(inv => {
			const totals = getInvoiceTotals(inv.lines, inv.vatRate || 20);
			return `
				<tr>
					<td><span class="item-main">${esc(inv.number || 'فاتورة')}</span><div class="item-sub">${esc(inv.date)}</div></td>
					<td>${esc(inv.supplier)}</td>
					<td>${(inv.lines || []).length} مادة</td>
					<td>${money(totals.subtotal)}</td>
					<td>${money(totals.vatAmount)}</td>
					<td><strong>${money(totals.total)}</strong></td>
					<td>
						<div class="toolbar-actions">
							<button class="icon-button" data-view-invoice="${esc(inv.id)}" title="معاينة تفاصيل الفاتورة" style="color:#0284c7;">${icon('eye')}</button>
							<button class="icon-button" data-delete-invoice="${esc(inv.id)}" title="حذف الفاتورة وعكس المخزون">${icon('trash-2')}</button>
						</div>
					</td>
				</tr>
			`;
		}).join('');

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>فواتير التوريد</h2><div class="panel-subtitle">تُضاف كميات المواد تلقائياً للمخزون</div></div>
					<label class="search-field">${icon('search')}<input id="invoiceSearch" type="search" value="${esc(search)}" placeholder="ابحث برقم الفاتورة أو المورد..."></label>
				</div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>رقم وتاريخ الفاتورة</th><th>المورّد</th><th>البنود</th><th>المجموع HT</th><th>TVA</th><th>الإجمالي TTC</th><th>إجراء</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('لا توجد فواتير', 'سجّل أول فاتورة توريد.')}
			</section>
		`;
		refreshIcons();
	}

	// 9. Suppliers View
	function renderSuppliers(search = '') {
		setHeader('suppliers', `<button class="button button-primary" data-open-dialog="supplierDialog">${icon('plus')}إضافة مورّد</button>`);
		const term = search.trim().toLowerCase();
		const matching = state.suppliers.filter(s => `${s.name} ${s.contact} ${s.phone} ${s.email}`.toLowerCase().includes(term));

		const rows = matching.map(s => {
			const days = Array.isArray(s.workDays) && s.workDays.length ? s.workDays.join('، ') : 'غير محدد';
			return `
				<tr>
					<td><span class="item-main">${esc(s.name)}</span><div class="item-sub">${esc(s.contact || '—')}</div></td>
					<td>${esc(s.phone || '—')}</td>
					<td>${esc(s.email || '—')}</td>
					<td>${esc(s.address || '—')}</td>
					<td>${esc(days)}</td>
					<td>${esc(s.notes || '—')}</td>
					<td>
						<div class="toolbar-actions">
							<button class="icon-button" data-order-supplier="${esc(s.id)}" title="طلب مواد من هذا المورّد" style="color:#0284c7;">${icon('shopping-cart')}</button>
							<button class="icon-button" data-edit-supplier="${esc(s.id)}" title="تعديل">${icon('pencil')}</button>
							<button class="icon-button" data-delete-supplier="${esc(s.id)}" title="حذف">${icon('trash-2')}</button>
						</div>
					</td>
				</tr>
			`;
		}).join('');

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>دليل المورّدين</h2><div class="panel-subtitle">${state.suppliers.length} مورد مسجل</div></div>
					<label class="search-field">${icon('search')}<input id="supplierSearch" type="search" value="${esc(search)}" placeholder="ابحث في الموردين..."></label>
				</div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>المورد والمسؤول</th><th>الهاتف</th><th>البريد</th><th>العنوان</th><th>أيام العمل</th><th>ملاحظات</th><th>إجراء</th></tr></thead><tbody>${rows}</tbody></table></div>` : emptyState('لا يوجد موردون', 'أضف بيانات الموردين لتسهيل التواصل والطلبيات.')}
			</section>
		`;
		refreshIcons();
	}

	// 10. Stocktake View (الجرد السريع)
	function renderStocktake() {
		setHeader('stocktake', `<button class="button button-primary" id="applyStocktake" ${state.materials.length ? '' : 'disabled'}>${icon('check')}اعتماد الجرد</button>`);
		const rows = state.materials.map(m => `
			<tr>
				<td><span class="item-main">${esc(m.name)}</span><div class="item-sub">${esc(m.category || '')}</div></td>
				<td>${quantity(m.quantity)} ${esc(m.unit)}</td>
				<td>${money(m.cost)}</td>
				<td><input class="stock-count-input" type="number" min="0" step="0.01" value="${Number(m.quantity)}" data-count-id="${esc(m.id)}" aria-label="الجرد الفعلي"><small class="item-sub" data-diff-for="${esc(m.id)}">الفرق: 0 ${esc(m.unit)}</small></td>
			</tr>
		`).join('');

		const historyRows = state.stocktakes.map(st => `
			<div class="whatsapp-message-item">
				<div>
					<strong>جرد تاريخ ${esc(st.date)}</strong>
					<div class="item-sub">${st.items?.length || 0} مادة تم جردها</div>
				</div>
				<button class="icon-button" data-delete-stocktake="${esc(st.id)}" title="حذف السجل">${icon('trash-2')}</button>
			</div>
		`).join('');

		viewContent.innerHTML = `
			<section class="panel">
				<div class="panel-head"><div><h2>مطابقة الرصيد الفعلي</h2><div class="panel-subtitle">أدخل الكميات الفعلية واضغط اعتماد لتحديث الأرصدة تلقائياً</div></div></div>
				${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>المادة</th><th>رصيد النظام الحالي</th><th>تكلفة الوحدة</th><th>الكمية الفعلية بالجرد</th></tr></thead><tbody>${rows}</tbody></table></div><div class="panel-body"><button class="button button-primary" data-apply-count>${icon('check')}اعتماد وتحديث الأرصدة</button></div>` : emptyState('لا توجد مواد', 'أضف مواد أولاً للجرد.')}
			</section>
			<section class="panel">
				<div class="panel-head"><h2>سجل عمليات الجرد السابقة</h2></div>
				<div class="panel-body">${historyRows || '<p class="item-sub">لا يوجد جرد سابق</p>'}</div>
			</section>
		`;
		refreshIcons();
	}

	// 11. General Stocktake View (الجرد العام والمسودات)
	async function renderGeneralStocktake() {
		setHeader('generalStocktake', `<label class="field stocktake-employee-field">الموظف القائم بالجرد<input id="generalStocktakeEmployeeName" maxlength="80" placeholder="اسم الموظف" style="height:35px;"></label><button class="button button-primary" type="button" data-new-general-stocktake>${icon('plus')}بدء جرد عام جديد</button>`);

		let stocktakes = [];
		try {
			const res = await window.ObayoliCloud.request('/api/stocktakes');
			stocktakes = res.stocktakes || [];
		} catch (e) {
			stocktakes = [];
		}

		const active = stocktakes.find(s => s.id === selectedGeneralStocktakeId && s.status === 'draft');

		let draftHtml = '';
		if (active) {
			const draftRows = active.items.map(it => `
				<tr>
					<td><strong>${esc(it.name)}</strong></td>
					<td>${esc(it.category || '—')}</td>
					<td>${quantity(it.theoreticalQuantity)} ${esc(it.unit)}</td>
					<td><input type="number" min="0" step="0.01" value="${it.actualQuantity !== null ? it.actualQuantity : ''}" data-general-actual="${esc(it.materialId)}" placeholder="الفعلي"></td>
					<td>${money(it.unitCost)}</td>
					<td><input type="text" value="${esc(it.reason || '')}" data-general-reason="${esc(it.materialId)}" placeholder="سبب الفرق"></td>
				</tr>
			`).join('');

			draftHtml = `
				<section class="panel">
					<div class="panel-head"><div><h2>مسودة الجرد (${esc(active.number)})</h2><div class="panel-subtitle">القائم بالجرد: ${esc(active.createdBy?.name || '—')}</div></div><span class="badge badge-low">مسودة</span></div>
					<form id="generalStocktakeDraftForm" data-stocktake-id="${esc(active.id)}">
						<div class="table-wrap"><table class="data-table"><thead><tr><th>المادة</th><th>الفئة</th><th>الكمية النظرية</th><th>الكمية الفعلية</th><th>تكلفة الوحدة</th><th>ملاحظات</th></tr></thead><tbody>${draftRows}</tbody></table></div>
						<div class="panel-body">
							<div class="toolbar-actions">
								<button class="button button-secondary" type="button" data-save-general-stocktake>${icon('save')}حفظ كمسودة</button>
								<button class="button button-primary" type="button" data-approve-general-stocktake>${icon('check')}اعتماد الجرد وتسوية المخزون</button>
							</div>
						</div>
					</form>
				</section>
			`;
		}

		const listHtml = stocktakes.map(s => `
			<div class="whatsapp-message-item">
				<div>
					<strong>${esc(s.number)} (${esc(s.status === 'draft' ? 'مسودة' : 'معتمد')})</strong>
					<div class="item-sub">تاريخ: ${esc(s.createdAt?.slice(0, 10))} · الموظف: ${esc(s.createdBy?.name || '—')} · ${s.items?.length || 0} مادة</div>
				</div>
				<div>
					${s.status === 'draft' ? `<button class="button button-secondary" data-open-general-stocktake="${esc(s.id)}">فتح وتعديل</button>` : `<span class="badge badge-ok">تم الاعتماد</span>`}
				</div>
			</div>
		`).join('');

		viewContent.innerHTML = `
			${draftHtml}
			<section class="panel">
				<div class="panel-head"><h2>سجلات الجرد العام</h2></div>
				<div class="panel-body">${listHtml || emptyState('لا توجد سجلات جرد عام', 'انقر على "بدء جرد عام جديد" لإنشاء مسودة شاملة للمخزون.')}</div>
			</section>
		`;
		refreshIcons();
	}

	// 12. Monthly Report View
	function renderMonthlyReport(month = today().slice(0, 7)) {
		setHeader('monthly');
		const selMonth = /^\d{4}-\d{2}$/.test(month) ? month : today().slice(0, 7);
		const monthInvoices = state.invoices.filter(inv => inv.date?.startsWith(selMonth));
		const monthMovements = state.movements.filter(m => m.date?.startsWith(selMonth));
		const invoiceTotal = monthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

		// Math fix: calculate accurately based on movements from month start to today
		const summaryRows = state.materials.map(m => {
			const mMovements = monthMovements.filter(mov => mov.materialId === m.id);
			const inQty = mMovements.filter(mov => mov.type === 'in').reduce((acc, mov) => acc + Number(mov.quantity), 0);
			const outQty = mMovements.filter(mov => mov.type === 'out').reduce((acc, mov) => acc + Number(mov.quantity), 0);
			const wasteQty = mMovements.filter(mov => mov.type === 'waste').reduce((acc, mov) => acc + Number(mov.quantity), 0);

			// Accurately compute balance at start of selected month
			const laterMovements = state.movements.filter(mov => mov.materialId === m.id && mov.date >= `${selMonth}-01`);
			const netLater = laterMovements.reduce((acc, mov) => acc + (mov.type === 'in' ? Number(mov.quantity) : -Number(mov.quantity)), 0);
			const opening = Number(m.quantity) - netLater;
			const closing = opening + inQty - outQty - wasteQty;

			return {
				name: m.name,
				unit: m.unit,
				opening,
				inQty,
				outQty,
				wasteQty,
				closing,
				cost: Number(m.cost) || 0
			};
		});

		const tableRows = summaryRows.map(r => `
			<tr>
				<td><strong>${esc(r.name)}</strong></td>
				<td>${quantity(r.opening)} ${esc(r.unit)}</td>
				<td>${quantity(r.inQty)} ${esc(r.unit)}</td>
				<td>${quantity(r.outQty)} ${esc(r.unit)}</td>
				<td>${quantity(r.wasteQty)} ${esc(r.unit)}</td>
				<td class="stock-quantity ${r.closing <= 0 ? 'low' : ''}">${quantity(r.closing)} ${esc(r.unit)}</td>
			</tr>
		`).join('');

		viewContent.innerHTML = `
			<div class="metric-grid">
				<article class="metric"><div class="metric-top"><span>فواتير الشهر</span><span class="metric-icon">${icon('receipt')}</span></div><div class="metric-value">${monthInvoices.length}</div><div class="metric-note">فاتورة توريد</div></article>
				<article class="metric"><div class="metric-top"><span>إجمالي التوريد</span><span class="metric-icon">${icon('coins')}</span></div><div class="metric-value">${money(invoiceTotal)}</div><div class="metric-note">خلال ${selMonth}</div></article>
				<article class="metric"><div class="metric-top"><span>حركات الدخول</span><span class="metric-icon">${icon('package-plus')}</span></div><div class="metric-value">${monthMovements.filter(m => m.type === 'in').length}</div><div class="metric-note">حركة مسجلة</div></article>
				<article class="metric alert"><div class="metric-top"><span>حركات الصرف والهدر</span><span class="metric-icon">${icon('package-minus')}</span></div><div class="metric-value">${monthMovements.filter(m => m.type !== 'in').length}</div><div class="metric-note">حركة مسجلة</div></article>
			</div>
			<section class="panel">
				<div class="panel-head toolbar">
					<div><h2>ملخص استهلاك وحركة المواد لشهر ${selMonth}</h2></div>
					<label class="field">اختر الشهر<input id="monthlyReportMonth" type="month" value="${selMonth}" style="height:35px;"></label>
				</div>
				<div class="table-wrap">
					<table class="data-table">
						<thead><tr><th>اسم المادة</th><th>رصيد بداية الشهر</th><th>إجمالي الدخول</th><th>إجمالي الخروج</th><th>إجمالي الهدر</th><th>رصيد نهاية الشهر</th></tr></thead>
						<tbody>${tableRows}</tbody>
					</table>
				</div>
			</section>
			<section class="panel">
				<div class="panel-head"><h2>الرسم البياني للمواد الأكثر استهلاكاً</h2></div>
				<div class="panel-body" style="min-height:300px;"><canvas id="monthlyConsumptionChart" style="max-height:280px;"></canvas></div>
			</section>
		`;
		refreshIcons();

		// Render Chart.js with correct tooltip context.parsed.y
		setTimeout(() => {
			const ctx = document.getElementById('monthlyConsumptionChart');
			if (!ctx || !window.Chart) return;
			const sorted = summaryRows.filter(r => r.outQty > 0).sort((a, b) => b.outQty - a.outQty).slice(0, 8);
			if (!sorted.length) return;

			if (window.activeMonthlyChart) window.activeMonthlyChart.destroy();
			window.activeMonthlyChart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: sorted.map(s => s.name),
					datasets: [{
						label: 'الكمية المصروفة',
						data: sorted.map(s => s.outQty),
						backgroundColor: '#d85b91',
						borderRadius: 4
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						tooltip: {
							callbacks: {
								label: (context) => `الكمية: ${quantity(context.parsed.y)}`
							}
						}
					}
				}
			});
		}, 50);
	}

	// 13. WhatsApp View (Fixed: No duplicate event listener)
	function getWhatsappMessages() {
		try {
			return JSON.parse(localStorage.getItem('whatsapp-messages') || '[]');
		} catch (e) { return []; }
	}

	function renderWhatsapp() {
		setHeader('whatsapp');
		const msgs = getWhatsappMessages();
		const list = msgs.map(m => `
			<div class="whatsapp-message-item">
				<div>
					<div class="whatsapp-message-item-phone">${esc(m.phone)}</div>
					<div class="whatsapp-message-item-text">${esc(m.message)}</div>
					<div class="whatsapp-message-item-date">${esc(m.date)} ${esc(m.time)}</div>
				</div>
				<button class="icon-button" data-delete-whatsapp-message="${esc(m.id)}" title="حذف">${icon('trash-2')}</button>
			</div>
		`).join('');

		viewContent.innerHTML = `
			<div class="whatsapp-header">${icon('message-circle')}<h2>إرسال رسائل WhatsApp المباشرة</h2></div>
			<section class="panel">
				<div class="panel-head"><h2>رسالة جديدة</h2></div>
				<form id="whatsappQuickForm" class="panel-body whatsapp-form">
					<div class="form-grid">
						<label class="field">رقم الهاتف (مع الرمز الدولي)<input name="phone" type="tel" required placeholder="مثال: 212600000000"></label>
						<label class="field full-span">نص الرسالة<textarea name="message" rows="3" required placeholder="اكتب طلبية التوريد أو الرسالة هنا..."></textarea></label>
					</div>
					<button class="whatsapp-send-btn" type="submit">${icon('send')}إرسال عبر WhatsApp</button>
				</form>
			</section>
			<section class="panel">
				<div class="panel-head"><h2>سجل الرسائل المرسلة</h2></div>
				<div class="panel-body">${list || emptyState('لا توجد رسائل', 'الرسائل المرسلة ستُحفظ هنا.')}</div>
			</section>
		`;
		refreshIcons();
	}

	function render(view = 'dashboard') {
		viewContent.dataset.view = view;
		if (view === 'materials') renderMaterials();
		else if (view === 'inventory') renderInventory();
		else if (view === 'purchaseOrders') renderPurchaseOrders();
		else if (view === 'waste') renderWaste();
		else if (view === 'consumption') renderConsumption();
		else if (view === 'technicalSheets') renderTechnicalSheets();
		else if (view === 'dishSales') renderDishSales();
		else if (view === 'invoices') renderInvoices();
		else if (view === 'suppliers') renderSuppliers();
		else if (view === 'stocktake') renderStocktake();
		else if (view === 'generalStocktake') renderGeneralStocktake();
		else if (view === 'monthly') renderMonthlyReport();
		else if (view === 'whatsapp') renderWhatsapp();
		else renderDashboard();
	}

	// Dialog helpers
	function openTechnicalSheetDialog(sheetId = null) {
		const dlg = document.getElementById('technicalSheetDialog');
		const form = document.getElementById('technicalSheetForm');
		if (!dlg || !form) return;
		form.reset();

		const container = document.getElementById('technicalLines');
		container.innerHTML = '';

		if (sheetId) {
			const sheet = state.technicalSheets.find(s => s.id === sheetId);
			if (sheet) {
				form.elements.id.value = sheet.id;
				form.elements.kind.value = sheet.kind || 'recipe';
				form.elements.name.value = sheet.name;
				form.elements.category.value = sheet.category || '';
				form.elements.yield.value = sheet.yield || 1;
				form.elements.department.value = sheet.department || 'cuisine';
				form.elements.prepTime.value = sheet.prepTime || 0;
				form.elements.cookTime.value = sheet.cookTime || 0;
				form.elements.difficulty.value = sheet.difficulty || 'easy';
				form.elements.sellingPrice.value = sheet.sellingPrice || 0;
				form.elements.preparation.value = sheet.preparation || '';
				form.elements.notes.value = sheet.notes || '';

				if (Array.isArray(sheet.lines) && sheet.lines.length) {
					sheet.lines.forEach(l => addTechnicalLine(l));
				} else {
					addTechnicalLine();
				}
				const titleEl = document.querySelector('#technicalSheetDialog h2');
				if (titleEl) titleEl.textContent = 'تعديل Fiche Technique - ' + sheet.name;
			}
		} else {
			form.elements.id.value = '';
			const titleEl = document.querySelector('#technicalSheetDialog h2');
			if (titleEl) titleEl.textContent = 'إضافة Fiche Technique';
			addTechnicalLine();
		}

		dlg.showModal();
		refreshIcons();
	}

	function openDialog(name) {
		const dlg = document.getElementById(name);
		if (!dlg) return;

		if (name === 'materialDialog') {
			const form = document.getElementById('materialForm');
			form.reset();
			form.elements.id.value = '';
			form.elements.mode.value = 'add';
			form.elements.fex.value = '0';
			form.elements.cost.value = '0';
			form.elements.minimum.value = '0';
			form.querySelectorAll('[data-stock-field]').forEach(f => f.hidden = true);
			document.getElementById('materialDialogTitle').textContent = 'إضافة مادة';
		} else if (name === 'invoiceDialog') {
			const form = document.getElementById('invoiceForm');
			form.reset();
			form.elements.date.value = today();
			document.getElementById('invoiceLines').innerHTML = '';
			addInvoiceLine();
		} else if (name === 'supplierDialog') {
			const form = document.getElementById('supplierForm');
			form.reset();
			form.elements.id.value = '';
			const titleEl = document.getElementById('supplierDialogTitle');
			if (titleEl) titleEl.textContent = 'إضافة مورّد جديد';
			form.querySelectorAll('[name="workDays"]').forEach(cb => cb.checked = false);
		} else if (name === 'movementDialog') {
			const form = document.getElementById('movementForm');
			form.reset();
			form.elements.date.value = today();
			form.elements.cost.value = '0';
			const sel = form.querySelector('[name="materialId"]');
			sel.innerHTML = state.materials.map(m => `<option value="${esc(m.id)}">${esc(m.name)} (${quantity(m.quantity)} ${esc(m.unit)})</option>`).join('');
		} else if (name === 'technicalSheetDialog') {
			openTechnicalSheetDialog();
			return;
		} else if (name === 'dishSaleDialog') {
			const form = document.getElementById('dishSaleForm');
			form.reset();
			form.elements.date.value = today();
			const sel = form.querySelector('[name="technicalSheetId"]');
			sel.innerHTML = state.technicalSheets.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
		}
		dlg.showModal();
		refreshIcons();
	}

	function addInvoiceLine(prefillMaterialId = null, prefillQuantity = 1, prefillCost = 0) {
		const container = document.getElementById('invoiceLines');
		if (!container) return;
		const line = document.createElement('div');
		line.className = 'invoice-line';

		const selectedMat = prefillMaterialId ? state.materials.find(m => m.id === prefillMaterialId) : null;
		const actualCost = prefillCost || (selectedMat ? Number(selectedMat.cost) || 0 : 0);

		line.innerHTML = `
			<label class="field">المادة<select data-line-material required>
				<option value="">اختر مادة...</option>
				${state.materials.map(m => `<option value="${esc(m.id)}" data-cost="${esc(m.cost || 0)}" data-unit="${esc(m.unit || '')}" ${prefillMaterialId === m.id ? 'selected' : ''}>${esc(m.name)} (${esc(m.unit)})</option>`).join('')}
			</select></label>
			<label class="field">الكمية<input data-line-quantity type="number" min="0.01" step="0.01" value="${prefillQuantity}" required></label>
			<label class="field">سعر الوحدة HT<input data-line-cost type="number" min="0" step="0.01" value="${actualCost}" required></label>
			<label class="field">TVA %<input data-line-vat type="number" min="0" max="100" step="1" value="20"></label>
			<button class="icon-button" type="button" data-remove-line title="حذف السطر">${icon('x')}</button>
		`;

		const sel = line.querySelector('[data-line-material]');
		sel.onchange = () => {
			const opt = sel.selectedOptions[0];
			if (opt && opt.dataset.cost) {
				const costInp = line.querySelector('[data-line-cost]');
				if (costInp) costInp.value = opt.dataset.cost;
				updateInvoiceTotalsInDialog();
			}
		};

		container.appendChild(line);
		refreshIcons();
		updateInvoiceTotalsInDialog();
	}

	function addTechnicalLine(prefill = null) {
		const container = document.getElementById('technicalLines');
		if (!container) return;
		const line = document.createElement('div');
		line.className = 'invoice-line';

		const prefillVal = prefill ? (prefill.type === 'technicalSheet' || prefill.technicalSheetId ? `sheet:${prefill.technicalSheetId || prefill.itemId}` : `mat:${prefill.materialId || prefill.itemId}`) : '';
		const prefillQty = prefill ? Number(prefill.quantity) || 1 : 1;

		line.innerHTML = `
			<label class="field full-span">المادة أو الخبز<select data-tech-material required>
				<option value="">اختر مكوّناً...</option>
				${state.materials.map(m => `<option value="mat:${esc(m.id)}" ${prefillVal === 'mat:' + m.id ? 'selected' : ''}>${esc(m.name)} (${esc(m.unit)})</option>`).join('')}
				${state.technicalSheets.filter(s => s.kind === 'bread').map(b => `<option value="sheet:${esc(b.id)}" ${prefillVal === 'sheet:' + b.id ? 'selected' : ''}>${esc(b.name)} (خبز)</option>`).join('')}
			</select></label>
			<label class="field">الكمية<input data-tech-qty type="number" min="0.001" step="0.001" value="${prefillQty}" required></label>
			<button class="icon-button" type="button" data-remove-line title="حذف السطر">${icon('x')}</button>
		`;
		container.appendChild(line);
		refreshIcons();
	}

	function updateInvoiceTotalsInDialog() {
		const lines = [...document.querySelectorAll('#invoiceLines .invoice-line')].map(l => ({
			quantity: Number(l.querySelector('[data-line-quantity]')?.value) || 0,
			unitCost: Number(l.querySelector('[data-line-cost]')?.value) || 0,
			vatRate: Number(l.querySelector('[data-line-vat]')?.value) || 0
		}));
		const totals = getInvoiceTotals(lines);
		const sEl = document.getElementById('invoiceSubtotal');
		const vEl = document.getElementById('invoiceVatAmount');
		const tEl = document.getElementById('invoiceTotal');
		if (sEl) sEl.textContent = money(totals.subtotal);
		if (vEl) vEl.textContent = money(totals.vatAmount);
		if (tEl) tEl.textContent = money(totals.total);
	}

	// Global Form Handlers
	document.addEventListener('submit', event => {
		const form = event.target;

		if (form.id === 'whatsappQuickForm') {
			event.preventDefault();
			const data = new FormData(form);
			const phone = String(data.get('phone')).replace(/\D/g, '');
			const message = String(data.get('message')).trim();
			if (!phone || !message) { toast('أدخل رقم الهاتف والرسالة'); return; }

			const msgs = getWhatsappMessages();
			msgs.unshift({ id: id(), phone, message, date: today(), time: new Date().toLocaleTimeString('ar-MA') });
			localStorage.setItem('whatsapp-messages', JSON.stringify(msgs.slice(0, 50)));

			window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
			toast('تم تجهيز وفتح رسالة WhatsApp!');
			renderWhatsapp();
			return;
		}

		if (form.id === 'materialForm') {
			event.preventDefault();
			const data = new FormData(form);
			const editId = data.get('id');
			const existing = state.materials.find(m => m.id === editId);

			const fexInput = data.get('fex');
			const fexVal = (fexInput !== null && fexInput !== '') ? Number(fexInput) : (existing ? Number(existing.fex) || 0 : 0);

			const costInput = data.get('cost');
			const costVal = (costInput !== null && costInput !== '') ? Number(costInput) : (existing ? Number(existing.cost) || 0 : 0);

			const minInput = data.get('minimum');
			const minVal = (minInput !== null && minInput !== '') ? Number(minInput) : (existing ? Number(existing.minimum) || 0 : 0);

			const mode = String(data.get('mode') || 'add');
			const entryQty = Number(data.get('entryQuantity')) || 0;
			const entryDate = String(data.get('entryDate') || today());
			let finalQty = existing ? Number(existing.quantity) : Number(data.get('quantity')) || 0;

			if (mode === 'stock' && existing) {
				const curQtyInput = data.get('quantity');
				if (curQtyInput !== null && curQtyInput !== '') {
					finalQty = Number(curQtyInput) + entryQty;
				} else {
					finalQty = Number(existing.quantity) + entryQty;
				}
				if (entryQty > 0) {
					addMovement(existing, 'in', entryQty, 'دخول مادة (تعديل المخزون)', entryDate);
				}
			}

			const material = {
				id: editId || id(),
				name: String(data.get('name')).trim(),
				category: String(data.get('category') || '').trim(),
				unit: String(data.get('unit')).trim(),
				quantity: finalQty,
				minimum: minVal,
				cost: costVal,
				fex: fexVal,
				supplier: String(data.get('supplier') || '').trim(),
				barcode: String(data.get('barcode') || '').trim()
			};

			if (!material.name || !material.unit) { toast('تحقق من اسم المادة ووحدة القياس'); return; }

			if (existing) {
				const idx = state.materials.findIndex(m => m.id === editId);
				state.materials[idx] = material;
				toast(mode === 'stock' ? 'تم تحديث المخزون وتسجيل الكميات' : 'تم تحديث بيانات المادة بنجاح');
			} else {
				state.materials.push(material);
				toast('تمت إضافة المادة بنجاح');
			}

			saveState();
			document.getElementById('materialDialog')?.close();
			render(viewContent.dataset.view || 'materials');
			return;
		}

		if (form.id === 'wasteForm') {
			event.preventDefault();
			const data = new FormData(form);
			const mat = state.materials.find(m => m.id === data.get('materialId'));
			const qty = Number(data.get('quantity'));
			if (!mat || qty <= 0) { toast('تحقق من المادة والكمية'); return; }
			if (qty > Number(mat.quantity)) { toast('الكمية المراد هدرها أكبر من المتاح في المخزون'); return; }

			mat.quantity = Number(mat.quantity) - qty;
			addMovement(mat, 'waste', qty, String(data.get('note')), String(data.get('date')));
			saveState();
			renderWaste();
			toast('تم تسجيل الهدر وخصمه من المخزون');
			return;
		}

		if (form.id === 'consumptionForm') {
			event.preventDefault();
			const data = new FormData(form);
			const mat = state.materials.find(m => m.id === data.get('materialId'));
			const qty = Number(data.get('quantity'));
			const dept = String(data.get('department'));
			if (!mat || qty <= 0) { toast('تحقق من المادة والكمية'); return; }
			if (qty > Number(mat.quantity)) { toast('الكمية المصروفة تتجاوز رصيد المخزون الحالي'); return; }

			mat.quantity = Number(mat.quantity) - qty;
			addMovement(mat, 'out', qty, String(data.get('note')), String(data.get('date')), '', dept);
			saveState();
			renderConsumption();
			toast('تم صرف المادة بنجاح');
			return;
		}

		if (form.id === 'invoiceForm') {
			event.preventDefault();
			const data = new FormData(form);
			const lines = [...document.querySelectorAll('#invoiceLines .invoice-line')].map(l => ({
				materialId: l.querySelector('[data-line-material]')?.value,
				quantity: Number(l.querySelector('[data-line-quantity]')?.value) || 0,
				unitCost: Number(l.querySelector('[data-line-cost]')?.value) || 0,
				vatRate: Number(l.querySelector('[data-line-vat]')?.value) || 20
			})).filter(l => l.materialId && l.quantity > 0);

			if (!lines.length) { toast('أضف سطراً واحداً على الأقل للفاتورة'); return; }

			const invDate = String(data.get('date'));
			const invSup = String(data.get('supplier')).trim();
			const invNum = String(data.get('number')).trim();
			const totals = getInvoiceTotals(lines);

			const newInv = {
				id: id(),
				supplier: invSup,
				number: invNum,
				date: invDate,
				lines,
				subtotal: totals.subtotal,
				vatAmount: totals.vatAmount,
				total: totals.total
			};

			lines.forEach(l => {
				const mat = state.materials.find(m => m.id === l.materialId);
				if (mat) {
					mat.quantity = Number(mat.quantity) + l.quantity;
					mat.cost = l.unitCost;
					addMovement(mat, 'in', l.quantity, `فاتورة ${invNum || invSup}`, invDate, newInv.id);
				}
			});

			state.invoices.unshift(newInv);
			saveState();
			document.getElementById('invoiceDialog')?.close();
			render('invoices');
			toast('تم حفظ الفاتورة وإضافة البضاعة للمخزون');
			return;
		}

		if (form.id === 'technicalSheetForm') {
			event.preventDefault();
			const data = new FormData(form);
			const lines = [...document.querySelectorAll('#technicalLines .invoice-line')].map(l => {
				const val = l.querySelector('[data-tech-material]')?.value || '';
				const [type, item] = val.split(':');
				return {
					type: type === 'sheet' ? 'technicalSheet' : 'material',
					...(type === 'sheet' ? { technicalSheetId: item } : { materialId: item }),
					quantity: Number(l.querySelector('[data-tech-qty]')?.value) || 0
				};
			}).filter(l => l.quantity > 0);

			const sheet = {
				id: String(data.get('id')) || id(),
				kind: String(data.get('kind')),
				name: String(data.get('name')).trim(),
				category: String(data.get('category') || '').trim(),
				yield: Number(data.get('yield')) || 1,
				department: String(data.get('department') || 'cuisine'),
				prepTime: Number(data.get('prepTime')) || 0,
				cookTime: Number(data.get('cookTime')) || 0,
				difficulty: String(data.get('difficulty') || 'easy'),
				sellingPrice: Number(data.get('sellingPrice')) || 0,
				preparation: String(data.get('preparation') || '').trim(),
				notes: String(data.get('notes') || '').trim(),
				lines
			};

			const exIdx = state.technicalSheets.findIndex(s => s.id === sheet.id);
			if (exIdx >= 0) state.technicalSheets[exIdx] = sheet;
			else state.technicalSheets.unshift(sheet);

			saveState();
			document.getElementById('technicalSheetDialog')?.close();
			render('technicalSheets');
			toast('تم حفظ Fiche technique بنجاح');
			return;
		}

		if (form.id === 'dishSaleForm') {
			event.preventDefault();
			const data = new FormData(form);
			const sheet = state.technicalSheets.find(s => s.id === data.get('technicalSheetId'));
			const qty = Number(data.get('quantity')) || 1;
			const date = String(data.get('date'));
			if (!sheet) return;

			// Deduct ingredients
			(sheet.lines || []).forEach(line => {
				if (line.materialId || line.type === 'material') {
					const mat = state.materials.find(m => String(m.id) === String(line.materialId || line.itemId));
					if (mat) {
						const portion = (Number(line.quantity) / Math.max(1, Number(sheet.yield) || 1)) * qty;
						mat.quantity = Math.max(0, Number(mat.quantity) - portion);
						addMovement(mat, 'out', portion, `بيع طبق: ${sheet.name}`, date, sheet.id, sheet.department);
					}
				}
			});

			state.dishSales.unshift({
				id: id(),
				dishName: sheet.name,
				quantity: qty,
				date,
				department: sheet.department || 'cuisine',
				note: String(data.get('note') || '')
			});

			saveState();
			document.getElementById('dishSaleDialog')?.close();
			render('dishSales');
			toast('تم تسجيل البيع وخصم مقادير الطبق من المخزون');
			return;
		}

		if (form.id === 'supplierForm') {
			event.preventDefault();
			const data = new FormData(form);
			const sup = {
				id: String(data.get('id')) || id(),
				name: String(data.get('name')).trim(),
				contact: String(data.get('contact') || '').trim(),
				phone: String(data.get('phone') || '').trim(),
				email: String(data.get('email') || '').trim(),
				address: String(data.get('address') || '').trim(),
				workDays: data.getAll('workDays').map(String),
				notes: String(data.get('notes') || '').trim()
			};
			const exIdx = state.suppliers.findIndex(s => s.id === sup.id);
			if (exIdx >= 0) state.suppliers[exIdx] = sup;
			else state.suppliers.push(sup);

			saveState();
			document.getElementById('supplierDialog')?.close();
			render('suppliers');
			toast('تم حفظ بيانات المورّد');
			return;
		}

		if (form.id === 'movementForm') {
			event.preventDefault();
			const data = new FormData(form);
			const mat = state.materials.find(m => m.id === data.get('materialId'));
			const qty = Number(data.get('quantity'));
			const type = String(data.get('type'));
			const cost = Number(data.get('cost')) || Number(mat?.cost) || 0;
			if (!mat || qty <= 0) return;

			mat.quantity = Number(mat.quantity) + (type === 'in' ? qty : -qty);
			addMovement(mat, type, qty, String(data.get('note')), String(data.get('date')), '', '', cost);
			saveState();
			document.getElementById('movementDialog')?.close();
			render('inventory');
			toast('تم تسجيل الحركة بنجاح');
			return;
		}

		if (form.id === 'purchaseOrderForm') {
			event.preventDefault();
			const data = new FormData(form);
			const orderId = String(data.get('id') || '');
			const items = [...document.querySelectorAll('#poLines .invoice-line')].map(l => {
				const sel = l.querySelector('[data-po-line-material]');
				const matId = sel?.value;
				const mat = state.materials.find(m => m.id === matId);
				return {
					materialId: matId,
					name: mat ? mat.name : (sel?.selectedOptions[0]?.textContent || 'مادة'),
					quantity: Number(l.querySelector('[data-po-line-qty]')?.value) || 1,
					unit: String(l.querySelector('[data-po-line-unit]')?.value || (mat?.unit || 'kg')).trim(),
					price: Number(l.querySelector('[data-po-line-cost]')?.value) || 0
				};
			}).filter(i => i.materialId && i.quantity > 0);

			if (!items.length) { toast('أضف مادة واحدة على الأقل في الطلبية'); return; }

			let total = 0;
			items.forEach(i => { total += i.quantity * i.price; });

			const order = {
				id: orderId || id(),
				number: String(data.get('number')).trim(),
				supplier: String(data.get('supplier')).trim(),
				phone: String(data.get('phone')).trim(),
				date: String(data.get('date')),
				items,
				totalEstimated: total,
				notes: String(data.get('notes') || '').trim(),
				status: 'pending',
				createdAt: new Date().toISOString()
			};

			if (!Array.isArray(state.purchaseOrders)) state.purchaseOrders = [];
			const exIdx = state.purchaseOrders.findIndex(o => o.id === order.id);
			if (exIdx >= 0) {
				state.purchaseOrders[exIdx] = { ...state.purchaseOrders[exIdx], ...order };
			} else {
				state.purchaseOrders.unshift(order);
			}

			saveState();
			document.getElementById('purchaseOrderDialog')?.close();
			render(viewContent.dataset.view || 'purchaseOrders');
			toast('تم حفظ طلبية التوريد في السجل بنجاح!');
			return;
		}
	});

	// Global Click Handlers
	document.addEventListener('click', async event => {
		const target = event.target;

		if (target.closest('[data-close]')) {
			const closeTarget = target.closest('[data-close]');
			const dlg = document.getElementById(closeTarget.dataset.close);
			if (closeTarget.dataset.close === 'barcodeScannerDialog') {
				const video = document.getElementById('barcodeVideo');
				if (video && video.srcObject) {
					video.srcObject.getTracks().forEach(t => t.stop());
					video.srcObject = null;
				}
			}
			dlg?.close();
			return;
		}

		if (target.closest('[data-open-dialog]')) {
			openDialog(target.closest('[data-open-dialog]').dataset.openDialog);
			return;
		}

		if (target.closest('[data-view]')) {
			render(target.closest('[data-view]').dataset.view);
			return;
		}

		if (target.closest('[data-navigate]')) {
			render(target.closest('[data-navigate]').dataset.navigate);
			return;
		}

		if (target.closest('#navScrollLeftBtn')) {
			const scroller = document.getElementById('navScrollContainer');
			if (scroller) scroller.scrollBy({ left: -220, behavior: 'smooth' });
			const items = [...document.querySelectorAll('.nav-item')];
			const curIdx = items.findIndex(i => i.classList.contains('active'));
			if (curIdx < items.length - 1) render(items[curIdx + 1].dataset.view);
			return;
		}

		if (target.closest('#navScrollRightBtn')) {
			const scroller = document.getElementById('navScrollContainer');
			if (scroller) scroller.scrollBy({ left: 220, behavior: 'smooth' });
			const items = [...document.querySelectorAll('.nav-item')];
			const curIdx = items.findIndex(i => i.classList.contains('active'));
			if (curIdx > 0) render(items[curIdx - 1].dataset.view);
			return;
		}

		if (target.closest('[data-nav-step]')) {
			const step = Number(target.closest('[data-nav-step]').dataset.navStep);
			const items = [...document.querySelectorAll('.nav-item')];
			const curIdx = items.findIndex(i => i.classList.contains('active'));
			const nextItem = items[curIdx + step];
			if (nextItem) render(nextItem.dataset.view);
			return;
		}

		if (target.closest('#addInvoiceLine')) {
			addInvoiceLine();
			return;
		}

		if (target.closest('#addTechnicalLine')) {
			addTechnicalLine();
			return;
		}

		if (target.closest('[data-remove-line]')) {
			target.closest('.invoice-line')?.remove();
			updateInvoiceTotalsInDialog();
			updatePurchaseOrderTotalsInDialog();
			return;
		}

		// Purchase Orders click handlers
		if (target.closest('#openNewOrderBtn')) {
			openPurchaseOrderDialog();
			return;
		}

		if (target.closest('#poAddLineBtn')) {
			addPurchaseOrderLine();
			return;
		}

		if (target.closest('#quickOrderAllLowStockBtn') || target.closest('#dashOrderLowStockBtn') || target.closest('#alertOrderAllLowBtn')) {
			const lowItems = state.materials.filter(lowStock).map(m => ({
				materialId: m.id,
				quantity: Math.max(1, (Number(m.minimum) || 0) * 2 - (Number(m.quantity) || 0)),
				unit: m.unit,
				price: Number(m.cost) || 0
			}));
			if (!lowItems.length) {
				toast('جميع المواد في رصيد آمن حالياً!');
				return;
			}
			openPurchaseOrderDialog(null, null, lowItems);
			return;
		}

		const quickOrderMatBtn = target.closest('[data-quick-order-material]');
		if (quickOrderMatBtn) {
			const matId = quickOrderMatBtn.dataset.quickOrderMaterial;
			const m = state.materials.find(x => x.id === matId);
			if (m) {
				const suggestedOrder = Math.max(1, (Number(m.minimum) || 0) * 2 - (Number(m.quantity) || 0));
				openPurchaseOrderDialog(null, m.supplier || null, [{
					materialId: m.id,
					quantity: suggestedOrder,
					unit: m.unit,
					price: Number(m.cost) || 0
				}]);
				toast(`تم إعداد طلبية سريعة لـ ${m.name}`);
			}
			return;
		}

		const quickInvoiceMatBtn = target.closest('[data-quick-invoice-material]');
		if (quickInvoiceMatBtn) {
			const matId = quickInvoiceMatBtn.dataset.quickInvoiceMaterial;
			const m = state.materials.find(x => x.id === matId);
			if (m) {
				openDialog('invoiceDialog');
				const form = document.getElementById('invoiceForm');
				if (form && m.supplier) {
					form.elements.supplier.value = m.supplier;
				}
				const container = document.getElementById('invoiceLines');
				if (container) {
					container.innerHTML = '';
					const suggestedDeficit = Math.max(1, (Number(m.minimum) || 0) * 2 - (Number(m.quantity) || 0));
					addInvoiceLine(m.id, suggestedDeficit, Number(m.cost) || 0);
				}
				toast(`تم تجهيز فاتورة توريد سريعة لـ ${m.name}`);
			}
			return;
		}

		if (target.closest('#poAutoFetchLowStockBtn')) {
			const supName = document.getElementById('poSupplierSelect')?.value;
			const filtered = state.materials.filter(m => lowStock(m) && (!supName || m.supplier === supName));
			if (!filtered.length) {
				toast(supName ? 'لا توجد مواد ناقصة مسجلة لهذا المورّد' : 'لا توجد مواد تحت حد الأمان حالياً');
				return;
			}
			const container = document.getElementById('poLines');
			container.innerHTML = '';
			filtered.forEach(m => {
				addPurchaseOrderLine(m.id, Math.max(1, (Number(m.minimum) || 0) * 2 - (Number(m.quantity) || 0)), m.unit, Number(m.cost) || 0);
			});
			updatePurchaseOrderTotalsInDialog();
			toast(`تم جلب ${filtered.length} مواد ناقصة للطلبية تلقائياً!`);
			return;
		}

		if (target.closest('#poSendWhatsappBtn')) {
			const form = document.getElementById('purchaseOrderForm');
			const data = new FormData(form);
			const items = [...document.querySelectorAll('#poLines .invoice-line')].map(l => {
				const sel = l.querySelector('[data-po-line-material]');
				const mat = state.materials.find(m => m.id === sel?.value);
				return {
					materialId: sel?.value,
					name: mat ? mat.name : (sel?.selectedOptions[0]?.textContent || 'مادة'),
					quantity: Number(l.querySelector('[data-po-line-qty]')?.value) || 1,
					unit: String(l.querySelector('[data-po-line-unit]')?.value || (mat?.unit || 'kg')).trim(),
					price: Number(l.querySelector('[data-po-line-cost]')?.value) || 0
				};
			}).filter(i => i.materialId && i.quantity > 0);

			if (!items.length) { toast('أضف مادة واحدة على الأقل قبل الإرسال'); return; }
			let total = 0; items.forEach(i => total += i.quantity * i.price);

			const tempOrder = {
				number: String(data.get('number')).trim(),
				supplier: String(data.get('supplier')).trim(),
				phone: String(data.get('phone')).trim(),
				date: String(data.get('date')),
				items,
				totalEstimated: total,
				notes: String(data.get('notes') || '').trim()
			};
			sendPurchaseOrderWhatsapp(tempOrder);
			return;
		}

		if (target.closest('#poDownloadPdfBtn')) {
			const form = document.getElementById('purchaseOrderForm');
			const data = new FormData(form);
			const items = [...document.querySelectorAll('#poLines .invoice-line')].map(l => {
				const sel = l.querySelector('[data-po-line-material]');
				const mat = state.materials.find(m => m.id === sel?.value);
				return {
					materialId: sel?.value,
					name: mat ? mat.name : (sel?.selectedOptions[0]?.textContent || 'مادة'),
					quantity: Number(l.querySelector('[data-po-line-qty]')?.value) || 1,
					unit: String(l.querySelector('[data-po-line-unit]')?.value || (mat?.unit || 'kg')).trim(),
					price: Number(l.querySelector('[data-po-line-cost]')?.value) || 0
				};
			}).filter(i => i.materialId && i.quantity > 0);

			if (!items.length) { toast('أضف مادة واحدة على الأقل قبل التنزيل'); return; }
			let total = 0; items.forEach(i => total += i.quantity * i.price);

			const tempOrder = {
				number: String(data.get('number')).trim(),
				supplier: String(data.get('supplier')).trim(),
				phone: String(data.get('phone')).trim(),
				date: String(data.get('date')),
				items,
				totalEstimated: total,
				notes: String(data.get('notes') || '').trim()
			};
			printPurchaseOrderPdf(tempOrder);
			return;
		}

		const orderWhatsapp = target.closest('[data-order-whatsapp]');
		if (orderWhatsapp) {
			const ord = (state.purchaseOrders || []).find(o => o.id === orderWhatsapp.dataset.orderWhatsapp);
			if (ord) sendPurchaseOrderWhatsapp(ord);
			return;
		}

		const orderPdf = target.closest('[data-order-pdf]');
		if (orderPdf) {
			const ord = (state.purchaseOrders || []).find(o => o.id === orderPdf.dataset.orderPdf);
			if (ord) printPurchaseOrderPdf(ord);
			return;
		}

		const orderToInv = target.closest('[data-order-to-invoice]');
		if (orderToInv) {
			const ord = (state.purchaseOrders || []).find(o => o.id === orderToInv.dataset.orderToInvoice);
			if (ord) convertPurchaseOrderToInvoice(ord);
			return;
		}

		const delOrder = target.closest('[data-delete-order]');
		if (delOrder) {
			const ordId = delOrder.dataset.deleteOrder;
			if (confirm('حذف هذه الطلبية من السجل؟')) {
				state.purchaseOrders = (state.purchaseOrders || []).filter(o => o.id !== ordId);
				saveState();
				render(viewContent.dataset.view);
				toast('تم حذف الطلبية');
			}
			return;
		}

		const orderSup = target.closest('[data-order-supplier]');
		if (orderSup) {
			const supId = orderSup.dataset.orderSupplier;
			openPurchaseOrderDialog(null, supId);
			return;
		}

		// Delete Movement
		const delMov = target.closest('[data-delete-movement]');
		if (delMov) {
			const movId = delMov.dataset.deleteMovement;
			const mov = state.movements.find(m => m.id === movId);
			if (mov && confirm('حذف هذه الحركة وعكس تأثيرها على الرصيد؟')) {
				const mat = state.materials.find(m => m.id === mov.materialId);
				if (mat) {
					mat.quantity = Number(mat.quantity) + (mov.type === 'in' ? -Number(mov.quantity) : Number(mov.quantity));
				}
				state.movements = state.movements.filter(m => m.id !== movId);
				saveState();
				render(viewContent.dataset.view);
				toast('تم حذف الحركة وعكس رصيدها');
			}
			return;
		}

		// Delete Invoice
		const delInv = target.closest('[data-delete-invoice]');
		if (delInv) {
			const invId = delInv.dataset.deleteInvoice;
			const inv = state.invoices.find(i => i.id === invId);
			if (inv && confirm('حذف الفاتورة وعكس كمياتها من المخزون؟')) {
				(inv.lines || []).forEach(l => {
					const mat = state.materials.find(m => m.id === l.materialId);
					if (mat) mat.quantity = Math.max(0, Number(mat.quantity) - Number(l.quantity));
				});
				state.movements = state.movements.filter(m => m.reference !== invId);
				state.invoices = state.invoices.filter(i => i.id !== invId);
				saveState();
				render('invoices');
				toast('تم حذف الفاتورة وعكس المخزون');
			}
			return;
		}

		// View Invoice Details
		const viewInv = target.closest('[data-view-invoice]');
		if (viewInv) {
			const invId = viewInv.dataset.viewInvoice;
			openInvoiceDetailDialog(invId);
			return;
		}

		// Delete Material
		const delMat = target.closest('[data-delete-material]');
		if (delMat) {
			const matId = delMat.dataset.deleteMaterial;
			const mat = state.materials.find(m => m.id === matId);
			if (mat && confirm(`حذف المادة «${mat.name}» نهائياً؟`)) {
				state.materials = state.materials.filter(m => m.id !== matId);
				saveState();
				render(viewContent.dataset.view);
				toast('تم حذف المادة');
			}
			return;
		}

		// Edit Material
		const editMat = target.closest('[data-edit-material]');
		if (editMat) {
			const mat = state.materials.find(m => m.id === editMat.dataset.editMaterial);
			if (mat) {
				const form = document.getElementById('materialForm');
				form.reset();
				form.elements.id.value = mat.id;
				form.elements.mode.value = 'edit';
				form.elements.name.value = mat.name;
				form.elements.category.value = mat.category || '';
				form.elements.unit.value = mat.unit;
				form.elements.fex.value = mat.fex || 0;
				form.elements.cost.value = mat.cost || 0;
				form.elements.minimum.value = mat.minimum || 0;
				form.elements.supplier.value = mat.supplier || '';
				form.elements.barcode.value = mat.barcode || '';
				form.querySelectorAll('[data-stock-field]').forEach(f => f.hidden = false);
				document.getElementById('materialDialogTitle').textContent = 'تعديل بيانات المادة';
				document.getElementById('materialDialog')?.showModal();
				refreshIcons();
			}
			return;
		}

		// Edit Stock
		const editStock = target.closest('[data-edit-stock]');
		if (editStock) {
			const mat = state.materials.find(m => m.id === editStock.dataset.editStock);
			if (mat) {
				const form = document.getElementById('materialForm');
				form.reset();
				form.elements.id.value = mat.id;
				form.elements.mode.value = 'stock';
				form.elements.name.value = mat.name;
				form.elements.category.value = mat.category || '';
				form.elements.unit.value = mat.unit;
				form.elements.quantity.value = mat.quantity;
				form.elements.entryQuantity.value = '0';
				form.elements.entryDate.value = today();
				form.elements.fex.value = mat.fex || 0;
				form.elements.cost.value = mat.cost || 0;
				form.elements.minimum.value = mat.minimum || 0;
				form.elements.supplier.value = mat.supplier || '';
				form.elements.barcode.value = mat.barcode || '';
				form.querySelectorAll('[data-stock-field]').forEach(f => f.hidden = false);
				document.getElementById('materialDialogTitle').textContent = 'تعديل المخزون - ' + mat.name;
				document.getElementById('materialDialog')?.showModal();
				refreshIcons();
			}
			return;
		}

		// Quick In-Movement
		const stockMov = target.closest('[data-stock-movement]');
		if (stockMov) {
			const mat = state.materials.find(m => m.id === stockMov.dataset.stockMovement);
			if (mat) {
				const form = document.getElementById('movementForm');
				form.reset();
				form.elements.date.value = today();
				form.elements.cost.value = mat.cost || 0;
				const sel = form.querySelector('[name="materialId"]');
				sel.innerHTML = state.materials.map(m => `<option value="${esc(m.id)}" ${m.id === mat.id ? 'selected' : ''}>${esc(m.name)} (${quantity(m.quantity)} ${esc(m.unit)})</option>`).join('');
				form.elements.type.value = stockMov.dataset.stockMovementType || 'in';
				document.getElementById('movementDialog')?.showModal();
				refreshIcons();
			}
			return;
		}

		// Edit Technical Sheet (Fiche Technique)
		const editTech = target.closest('[data-edit-technical]');
		if (editTech) {
			const sheetId = editTech.dataset.editTechnical;
			openTechnicalSheetDialog(sheetId);
			return;
		}

		// Delete Technical Sheet (Fiche Technique)
		const delTech = target.closest('[data-delete-technical]');
		if (delTech) {
			const sheetId = delTech.dataset.deleteTechnical;
			const sheet = state.technicalSheets.find(s => s.id === sheetId);
			if (sheet && confirm(`هل أنت متأكد من حذف Fiche technique «${sheet.name}»؟`)) {
				state.technicalSheets = state.technicalSheets.filter(s => s.id !== sheetId);
				saveState();
				render('technicalSheets');
				toast('تم حذف البطاقة التقنية بنجاح');
			}
			return;
		}

		// Edit Supplier
		const editSup = target.closest('[data-edit-supplier]');
		if (editSup) {
			const supId = editSup.dataset.editSupplier;
			const sup = state.suppliers.find(s => s.id === supId);
			if (sup) {
				const form = document.getElementById('supplierForm');
				form.reset();
				form.elements.id.value = sup.id;
				form.elements.name.value = sup.name;
				form.elements.contact.value = sup.contact || '';
				form.elements.phone.value = sup.phone || '';
				form.elements.email.value = sup.email || '';
				form.elements.rebBanque.value = sup.rebBanque || '';
				form.elements.address.value = sup.address || '';
				form.elements.notes.value = sup.notes || '';
				const wDays = Array.isArray(sup.workDays) ? sup.workDays : [];
				form.querySelectorAll('[name="workDays"]').forEach(cb => {
					cb.checked = wDays.includes(cb.value);
				});
				document.getElementById('supplierDialogTitle').textContent = 'تعديل بيانات المورّد';
				document.getElementById('supplierDialog')?.showModal();
				refreshIcons();
			}
			return;
		}

		// Delete Supplier
		const delSup = target.closest('[data-delete-supplier]');
		if (delSup) {
			const supId = delSup.dataset.deleteSupplier;
			const sup = state.suppliers.find(s => s.id === supId);
			if (sup && confirm(`هل أنت متأكد من حذف المورّد «${sup.name}»؟`)) {
				state.suppliers = state.suppliers.filter(s => s.id !== supId);
				saveState();
				render('suppliers');
				toast('تم حذف المورّد');
			}
			return;
		}

		// Delete Stocktake History Item
		const delSt = target.closest('[data-delete-stocktake]');
		if (delSt) {
			const stId = delSt.dataset.deleteStocktake;
			if (confirm('حذف هذا السجل من تاريخ الجرد؟')) {
				state.stocktakes = state.stocktakes.filter(s => s.id !== stId);
				saveState();
				render('stocktake');
				toast('تم حذف سجل الجرد');
			}
			return;
		}

		// Delete WhatsApp Message from History
		const delMsg = target.closest('[data-delete-whatsapp-message]');
		if (delMsg) {
			const msgId = delMsg.dataset.deleteWhatsappMessage;
			let msgs = getWhatsappMessages();
			msgs = msgs.filter(m => m.id !== msgId);
			localStorage.setItem('whatsapp-messages', JSON.stringify(msgs));
			renderWhatsapp();
			toast('تم حذف الرسالة من السجل');
			return;
		}

		// Barcode Scanner trigger
		if (target.closest('[data-start-barcode-scan]')) {
			const dlg = document.getElementById('barcodeScannerDialog');
			const video = document.getElementById('barcodeVideo');
			const status = document.getElementById('barcodeScannerStatus');
			if (!dlg || !video) return;

			dlg.showModal();
			if (status) status.textContent = 'جارٍ تشغيل الكاميرا لمسح الباركود...';

			if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
				navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
					.then(stream => {
						video.srcObject = stream;
						video.play();
						if (status) status.textContent = 'وجّه الكاميرا نحو باركود المادة (EAN-13 / UPC).';
						startBarcodeDetectionLoop(video, dlg);
					})
					.catch(err => {
						if (status) status.textContent = 'تعذر الوصول للكاميرا: ' + (err.message || 'يرجى إدخال الباركود يدوياً');
					});
			} else {
				if (status) status.textContent = 'المتصفح لا يدعم الوصول للكاميرا مباشرة. يمكنك كتابة الباركود يدوياً.';
			}
			return;
		}

		// Manual Barcode submit button
		if (target.closest('#manualBarcodeSubmitBtn')) {
			const inp = document.getElementById('manualBarcodeInput');
			if (inp && inp.value.trim()) {
				handleScannedBarcode(inp.value.trim());
			} else {
				toast('أدخل رقم الباركود أولاً');
			}
			return;
		}

		// Zero Stock
		const zeroStk = target.closest('[data-zero-stock]');
		if (zeroStk) {
			const mat = state.materials.find(m => m.id === zeroStk.dataset.zeroStock);
			if (mat && confirm(`تصفير رصيد «${mat.name}» وتسجيل خروج المتبقي؟`)) {
				const remaining = Number(mat.quantity);
				if (remaining > 0) addMovement(mat, 'out', remaining, 'تصفير رصيد المخزون');
				mat.quantity = 0;
				saveState();
				render('inventory');
				toast('تم تصفير الرصيد');
			}
			return;
		}

		// Apply Stocktake
		if (target.closest('[data-apply-count]') || target.closest('#applyStocktake')) {
			const inputs = [...document.querySelectorAll('[data-count-id]')];
			const countItems = [];
			inputs.forEach(inp => {
				const mat = state.materials.find(m => m.id === inp.dataset.countId);
				if (mat) {
					const actual = Number(inp.value) || 0;
					const diff = actual - Number(mat.quantity);
					if (diff !== 0) {
						addMovement(mat, diff > 0 ? 'in' : 'out', Math.abs(diff), 'تسوية جرد فعلي');
						mat.quantity = actual;
					}
					countItems.push({ materialId: mat.id, name: mat.name, actual, diff });
				}
			});
			state.stocktakes.unshift({ id: id(), date: today(), items: countItems });
			saveState();
			render('stocktake');
			toast('تم اعتماد الجرد وتسوية فروقات المخزون');
			return;
		}

		// General Stocktake actions
		if (target.closest('[data-new-general-stocktake]')) {
			const emp = document.getElementById('generalStocktakeEmployeeName')?.value.trim() || 'المسؤول';
			const res = await window.ObayoliCloud.request('/api/stocktakes', {
				method: 'POST',
				body: JSON.stringify({ employeeName: emp })
			});
			selectedGeneralStocktakeId = res.stocktake?.id;
			renderGeneralStocktake();
			toast('تم فتح مسودة جرد عام جديد');
			return;
		}

		if (target.closest('[data-open-general-stocktake]')) {
			selectedGeneralStocktakeId = target.closest('[data-open-general-stocktake]').dataset.openGeneralStocktake;
			renderGeneralStocktake();
			return;
		}

		if (target.closest('[data-save-general-stocktake]')) {
			const form = document.getElementById('generalStocktakeDraftForm');
			if (!form) return;
			const items = [...form.querySelectorAll('[data-general-actual]')].map(inp => ({
				materialId: inp.dataset.generalActual,
				actualQuantity: inp.value !== '' ? Number(inp.value) : null,
				reason: form.querySelector(`[data-general-reason="${inp.dataset.generalActual}"]`)?.value || ''
			}));
			await window.ObayoliCloud.request(`/api/stocktakes/${encodeURIComponent(form.dataset.stocktakeId)}`, {
				method: 'PUT',
				body: JSON.stringify({ items })
			});
			toast('تم حفظ مسودة الجرد بنجاح');
			return;
		}

		if (target.closest('[data-approve-general-stocktake]')) {
			const form = document.getElementById('generalStocktakeDraftForm');
			if (!form) return;
			const items = [...form.querySelectorAll('[data-general-actual]')].map(inp => ({
				materialId: inp.dataset.generalActual,
				actualQuantity: inp.value !== '' ? Number(inp.value) : null,
				reason: form.querySelector(`[data-general-reason="${inp.dataset.generalActual}"]`)?.value || ''
			}));
			await window.ObayoliCloud.request(`/api/stocktakes/${encodeURIComponent(form.dataset.stocktakeId)}`, {
				method: 'PUT',
				body: JSON.stringify({ items })
			});
			await window.ObayoliCloud.request(`/api/stocktakes/${encodeURIComponent(form.dataset.stocktakeId)}/approve`, { method: 'POST' });
			const latest = await window.ObayoliCloud.getState('restaurant');
			Object.assign(state, latest.payload);
			selectedGeneralStocktakeId = null;
			renderGeneralStocktake();
			toast('تم اعتماد الجرد العام وتسوية المخزون');
			return;
		}

		// PDF Export with safety against unequal columns
		if (target.closest('[data-export-view]')) {
			try {
				window.print();
				toast('تم تجهيز الطباعة وتصدير PDF');
			} catch (e) {
				toast('تعذر فتح نافذة الطباعة');
			}
			return;
		}

		// Settings & Language handlers
		if (target.closest('#settingsBtn')) {
			document.getElementById('settingsDialog')?.showModal();
			return;
		}
		if (target.closest('#langArabic')) {
			currentLanguage = 'ar';
			localStorage.setItem('appLanguage', 'ar');
			document.documentElement.lang = 'ar';
			document.documentElement.dir = 'rtl';
			updateClock();
			updateNavLanguage();
			render(viewContent.dataset.view);
			toast('تم تحويل اللغة إلى العربية');
			return;
		}
		if (target.closest('#langEnglish')) {
			currentLanguage = 'en';
			localStorage.setItem('appLanguage', 'en');
			document.documentElement.lang = 'en';
			document.documentElement.dir = 'ltr';
			updateClock();
			updateNavLanguage();
			render(viewContent.dataset.view);
			toast('Language set to English');
			return;
		}
		if (target.closest('#langFrench')) {
			currentLanguage = 'fr';
			localStorage.setItem('appLanguage', 'fr');
			document.documentElement.lang = 'fr';
			document.documentElement.dir = 'ltr';
			updateClock();
			updateNavLanguage();
			render(viewContent.dataset.view);
			toast('Langue configurée en Français');
			return;
		}
		if (target.closest('#backupBtn')) {
			const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = `obayoli_backup_${today()}.json`;
			a.click();
			toast('تم تنزيل النسخة الاحتياطية بنجاح');
			return;
		}
		if (target.closest('#restoreBtn')) {
			document.getElementById('restoreFile')?.click();
			return;
		}
		if (target.closest('#loadDemoDataBtn')) {
			if (confirm('هل ترغب في تحميل البيانات التجريبية الشاملة واستبدال البيانات الحالية؟')) {
				const demo = getDemoData();
				Object.assign(state, demo);
				saveState();
				render(viewContent.dataset.view || 'dashboard');
				document.getElementById('settingsDialog')?.close();
				toast('تم تحميل البيانات التجريبية بنجاح!');
			}
			return;
		}
		if (target.closest('#clearDataBtn')) {
			if (confirm('هل أنت متأكد من رغبتك في تفريغ وحذف جميع البيانات؟')) {
				localStorage.removeItem(storageKey);
				location.reload();
			}
			return;
		}
	});

	// Barcode helpers
	let barcodeDetectorInstance = null;
	let barcodeScanTimer = null;

	function closeBarcodeScanner() {
		const dlg = document.getElementById('barcodeScannerDialog');
		const video = document.getElementById('barcodeVideo');
		if (video && video.srcObject) {
			video.srcObject.getTracks().forEach(t => t.stop());
			video.srcObject = null;
		}
		if (barcodeScanTimer) {
			clearInterval(barcodeScanTimer);
			barcodeScanTimer = null;
		}
		const inp = document.getElementById('manualBarcodeInput');
		if (inp) inp.value = '';
		dlg?.close();
	}

	function startBarcodeDetectionLoop(video, dlg) {
		if (barcodeScanTimer) clearInterval(barcodeScanTimer);
		if ('BarcodeDetector' in window) {
			try {
				if (!barcodeDetectorInstance) {
					barcodeDetectorInstance = new window.BarcodeDetector({
						formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code']
					});
				}
				barcodeScanTimer = setInterval(async () => {
					if (!dlg.open || !video.videoWidth) return;
					try {
						const barcodes = await barcodeDetectorInstance.detect(video);
						if (barcodes.length > 0 && barcodes[0].rawValue) {
							handleScannedBarcode(barcodes[0].rawValue);
						}
					} catch (e) {}
				}, 400);
			} catch (e) {}
		}
	}

	function handleScannedBarcode(rawCode) {
		const code = String(rawCode || '').trim();
		if (!code) return;

		const matDlg = document.getElementById('materialDialog');
		if (matDlg && matDlg.open) {
			const bInp = matDlg.querySelector('[name="barcode"]');
			if (bInp) bInp.value = code;
			closeBarcodeScanner();
			toast(`تم إدراج الباركود: ${code}`);
			return;
		}

		const found = state.materials.find(m => m.barcode === code);
		if (found) {
			closeBarcodeScanner();
			render('inventory', found.name);
			toast(`تم العثور على: ${found.name} (الرصيد: ${quantity(found.quantity)} ${found.unit})`);
		} else {
			toast(`لم يتم العثور على مادة مسجلة برقم الباركود: ${code}`);
		}
	}

	// Input Search Filter Listeners with focus and cursor position retention
	document.addEventListener('input', event => {
		const target = event.target;
		const id = target.id;
		const isSearch = ['materialSearch', 'inventorySearch', 'movementSearch', 'purchaseOrderSearch', 'technicalSheetSearch', 'invoiceSearch', 'supplierSearch'].includes(id);

		let pos = null;
		if (isSearch) {
			pos = target.selectionStart;
		}

		if (id === 'materialSearch') renderMaterials(target.value);
		else if (id === 'inventorySearch') renderInventory(target.value, document.getElementById('movementSearch')?.value || '');
		else if (id === 'movementSearch') renderInventory(document.getElementById('inventorySearch')?.value || '', target.value);
		else if (id === 'purchaseOrderSearch') renderPurchaseOrders(target.value);
		else if (id === 'technicalSheetSearch') renderTechnicalSheets(target.value);
		else if (id === 'invoiceSearch') renderInvoices(target.value);
		else if (id === 'supplierSearch') renderSuppliers(target.value);

		if (isSearch) {
			const restored = document.getElementById(id);
			if (restored) {
				restored.focus();
				if (typeof pos === 'number') {
					try { restored.setSelectionRange(pos, pos); } catch (e) {}
				}
			}
		}

		// Realtime totals recalculation on invoice & purchase order line inputs
		if (target.closest('#invoiceLines')) {
			updateInvoiceTotalsInDialog();
		}
		if (target.closest('#poLines')) {
			updatePurchaseOrderTotalsInDialog();
		}

		if (target.matches('[data-count-id]')) {
			const mat = state.materials.find(m => m.id === target.dataset.countId);
			const diff = Number(target.value) - (Number(mat?.quantity) || 0);
			const badge = document.querySelector(`[data-diff-for="${target.dataset.countId}"]`);
			if (badge) badge.textContent = `الفرق: ${quantity(diff)} ${mat?.unit || ''}`;
		}
	});

	document.addEventListener('keydown', event => {
		if (event.target.id === 'manualBarcodeInput' && event.key === 'Enter') {
			event.preventDefault();
			const val = event.target.value.trim();
			if (val) handleScannedBarcode(val);
		}
	});

	document.addEventListener('change', event => {
		if (event.target.matches('[data-line-material]')) {
			const line = event.target.closest('.invoice-line');
			const mat = state.materials.find(m => m.id === event.target.value);
			if (mat && line) {
				const costInp = line.querySelector('[data-line-cost]');
				if (costInp) costInp.value = mat.cost || 0;
				updateInvoiceTotalsInDialog();
			}
		}
		if (event.target.id === 'monthlyReportMonth') {
			renderMonthlyReport(event.target.value);
		}
		if (event.target.id === 'restoreFile') {
			const file = event.target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = e => {
					try {
						const parsed = JSON.parse(e.target.result);
						if (parsed.materials) {
							Object.assign(state, parsed);
							saveState();
							toast('تمت استعادة البيانات بنجاح!');
							setTimeout(() => location.reload(), 1000);
						}
					} catch (err) { toast('ملف النسخة الاحتياطية غير صالح'); }
				};
				reader.readAsText(file);
			}
		}
	});

	function updateNavLanguage() {
		const t = translations[currentLanguage] || translations.ar;
		document.querySelectorAll('.nav-tabs [data-view]').forEach(btn => {
			const v = btn.dataset.view;
			const span = btn.querySelector('span');
			if (span && t[v]) span.textContent = t[v];
		});
	}

	// Clock & Init
	function updateClock() {
		const now = new Date();
		const dLocale = currentLanguage === 'fr' ? 'fr-FR' : currentLanguage === 'en' ? 'en-US' : 'ar-MA';
		const dateFormatter = new Intl.DateTimeFormat(dLocale, { dateStyle: 'full' });
		const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
		const dEl = document.getElementById('todayLabel');
		const cEl = document.getElementById('clockLabel');
		if (dEl) dEl.textContent = dateFormatter.format(now);
		if (cEl) cEl.textContent = timeFormatter.format(now);
	}
	updateClock();
	setInterval(updateClock, 30000);

	updateNavLanguage();

	// Start App
	render('dashboard');
})();
