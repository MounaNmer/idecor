/* Tapisserie Al Assala – catalog front end (no dependencies). */
(function () {
	'use strict';

	var DATA = window.AA_CATALOG || { products: [], categories: [] };
	var root = document.getElementById('aa-app');
	if (!root) return;

	/* ------------------------------------------------------------------ i18n */
	var LANGS = {
		ar: { label: 'العربية', short: 'AR', dir: 'rtl', locale: 'ar-MA-u-nu-latn' },
		fr: { label: 'Français', short: 'FR', dir: 'ltr', locale: 'fr-MA' }
	};
	var T = {
		ar: {
			title: 'الكتالوج', footerContact: 'تواصل معنا', footerWhatsapp: 'واتساب', footerRights: 'جميع الحقوق محفوظة.',
			other: 'أخرى', search: 'ابحث عن منتج…', clearSearch: 'مسح البحث', openSearch: 'بحث', closeSearch: 'إغلاق البحث',
			noResults: function (q) { return 'لا توجد نتائج لـ «' + q + '»'; },
			noProducts: 'لا توجد منتجات معروضة حالياً. عُد قريباً!', categories: 'الفئات', allProducts: 'كل المنتجات',
			backToCatalog: 'العودة إلى الكتالوج', description: 'الوصف', subtotalLabel: 'المجموع الفرعي', unitPrice: 'سعر الوحدة',
			orderThis: 'اطلب هذا المنتج', addToOrder: 'أضف إلى الطلبية',
			whatsappNote: 'تُرسل الطلبية إلى البائع عبر واتساب، مع اسمك وملاحظتك.', noPhoto: 'لا توجد صورة',
			photoOf: function (a, b) { return 'الصورة ' + a + ' من ' + b; }, prevPhoto: 'الصورة السابقة', nextPhoto: 'الصورة التالية',
			photosCount: function (n) { return n === 2 ? 'صورتان' : n + ' صور'; },
			oneColumn: 'منتج واحد في كل صف', twoColumns: 'منتجان في كل صف', language: 'اللغة', inOrder: 'في الطلبية',
			increase: 'زيادة', decrease: 'إنقاص', remove: 'حذف', quantity: 'الكمية', order: 'الطلبية', viewOrder: 'عرض الطلبية',
			items: function (n) { return n === 1 ? 'منتج واحد' : n === 2 ? 'منتجان' : n <= 10 ? n + ' منتجات' : n + ' منتجاً'; },
			total: 'المجموع', emptyOrder: 'الطلبية فارغة', emptyOrderHint: 'أضف منتجات من الكتالوج لتظهر هنا.',
			clearOrder: 'إفراغ الطلبية', confirmClear: 'سيتم حذف كل المنتجات من الطلبية.', clear: 'إفراغ',
			sendWhatsapp: 'إرسال الطلبية عبر واتساب', orderGreeting: 'مرحباً، أريد طلب ما يلي:', fullName: 'الاسم الكامل',
			nameRequired: 'أدخل اسمك الكامل لإرسال الطلبية.', orderNote: 'ملاحظة', optional: 'اختياري', cancel: 'إلغاء', close: 'إغلاق',
			added: 'تمت الإضافة إلى الطلبية'
		},
		fr: {
			title: 'Catalogue', footerContact: 'Contact', footerWhatsapp: 'WhatsApp', footerRights: 'Tous droits réservés.',
			other: 'Autres', search: 'Rechercher un produit…', clearSearch: 'Effacer la recherche', openSearch: 'Rechercher', closeSearch: 'Fermer la recherche',
			noResults: function (q) { return 'Aucun résultat pour « ' + q + ' »'; },
			noProducts: 'Aucun produit pour le moment. Revenez bientôt !', categories: 'Catégories', allProducts: 'Tous les produits',
			backToCatalog: 'Retour au catalogue', description: 'Description', subtotalLabel: 'Sous-total', unitPrice: 'Prix unitaire',
			orderThis: 'Commander ce produit', addToOrder: 'Ajouter',
			whatsappNote: 'La commande est envoyée au vendeur sur WhatsApp, avec votre nom et votre note.', noPhoto: 'Pas de photo',
			photoOf: function (a, b) { return 'Photo ' + a + ' sur ' + b; }, prevPhoto: 'Photo précédente', nextPhoto: 'Photo suivante',
			photosCount: function (n) { return n + ' photos'; },
			oneColumn: '1 produit par ligne', twoColumns: '2 produits par ligne', language: 'Langue', inOrder: 'Dans la commande',
			increase: 'Augmenter', decrease: 'Diminuer', remove: 'Retirer', quantity: 'Quantité', order: 'Commande', viewOrder: 'Voir la commande',
			items: function (n) { return n === 1 ? '1 article' : n + ' articles'; },
			total: 'Total', emptyOrder: 'La commande est vide', emptyOrderHint: 'Ajoutez des produits du catalogue pour les voir ici.',
			clearOrder: 'Vider la commande', confirmClear: 'Tous les produits seront retirés de la commande.', clear: 'Vider',
			sendWhatsapp: 'Envoyer la commande sur WhatsApp', orderGreeting: 'Bonjour, je souhaite commander :', fullName: 'Nom complet',
			nameRequired: 'Entrez votre nom complet pour envoyer la commande.', orderNote: 'Note', optional: 'facultatif', cancel: 'Annuler', close: 'Fermer',
			added: 'Ajouté à la commande'
		}
	};

	/* --------------------------------------------------------------- storage */
	var KEY = 'aa.catalog.';
	function load(k, d) { try { var v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
	function save(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }

	/* ----------------------------------------------------------------- state */
	var byId = {};
	DATA.products.forEach(function (p) { byId[p.id] = p; });

	var cartRaw = load('order', {});
	var cart = {};
	Object.keys(cartRaw || {}).forEach(function (id) { if (byId[id] && cartRaw[id] > 0) cart[id] = Math.min(99, cartRaw[id] | 0); });

	var S = {
		lang: LANGS[load('lang', '')] ? load('lang', '') : (DATA.defaultLang || 'ar'),
		cat: 'all',
		query: '',
		cols: load('cols', 2) === 1 ? 1 : 2,
		cart: cart,
		product: null,      // open product id
		qty: 1,             // qty picker in product sheet
		photo: 0,
		order: false,
		confirmClear: false,
		mobileSearch: false,
		langMenu: false,
		form: load('form', { name: '', note: '' }),
		nameErr: false
	};

	function t() { return T[S.lang]; }

	/* --------------------------------------------------------------- helpers */
	function esc(s) {
		return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}
	var fmtCache = {};
	function price(v) {
		var loc = LANGS[S.lang].locale;
		var k = loc + DATA.currency;
		if (!fmtCache[k]) {
			try {
				fmtCache[k] = new Intl.NumberFormat(loc, { style: 'currency', currency: DATA.currency || 'MAD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
			} catch (e) {
				fmtCache[k] = { format: function (n) { return n + ' ' + (DATA.currency || ''); } };
			}
		}
		return fmtCache[k].format(v);
	}
	function norm(s) {
		return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ٟ]/g, '');
	}
	function catName(id) {
		if (id === null || id === 'other') return t().other;
		for (var i = 0; i < DATA.categories.length; i++) if (DATA.categories[i].id === id) return DATA.categories[i].name;
		return '';
	}
	function cartCount() { var n = 0; for (var k in S.cart) n += S.cart[k]; return n; }
	function cartTotal() { var n = 0; for (var k in S.cart) n += S.cart[k] * byId[k].price; return n; }
	function setQty(id, q) {
		q = Math.max(0, Math.min(99, q | 0));
		if (q === 0) delete S.cart[id]; else S.cart[id] = q;
		save('order', S.cart);
	}

	/* ----------------------------------------------------------------- icons */
	function icon(name, cls) {
		var P = {
			search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
			languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
			x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
			plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
			minus: '<path d="M5 12h14"/>',
			trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
			bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
			chevL: '<path d="m15 18-6-6 6-6"/>',
			chevR: '<path d="m9 18 6-6-6-6"/>',
			check: '<path d="M20 6 9 17l-5-5"/>',
			square: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
			grid2: '<rect width="7" height="18" x="3" y="3" rx="1"/><rect width="7" height="18" x="14" y="3" rx="1"/>',
			pkg: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
			image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'
		};
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || '') + '" aria-hidden="true">' + P[name] + '</svg>';
	}
	var WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';

	/* ------------------------------------------------------------- filtering */
	function visibleProducts() {
		var q = norm(S.query.trim());
		return DATA.products.filter(function (p) {
			if (q) return norm(p.name).indexOf(q) !== -1 || norm(p.description).indexOf(q) !== -1 || norm(catName(p.categoryId)).indexOf(q) !== -1;
			if (S.cat === 'all') return true;
			if (S.cat === 'other') return p.categoryId === null;
			return p.categoryId === S.cat;
		});
	}
	function catList() {
		var list = [{ key: 'all', name: t().allProducts, count: DATA.products.length }];
		DATA.categories.forEach(function (c) { list.push({ key: c.id, name: c.name, count: c.count }); });
		if (DATA.otherCount > 0) list.push({ key: 'other', name: t().other, count: DATA.otherCount });
		return list;
	}

	/* ------------------------------------------------------------- templates */
	function searchField(id) {
		return '<div class="search-field">' + icon('search', 'lead') +
			'<input id="' + id + '" type="search" data-search autocomplete="off" placeholder="' + esc(t().search) + '" aria-label="' + esc(t().search) + '" value="' + esc(S.query) + '">' +
			(S.query ? '<button type="button" class="btn btn-icon clear" data-act="clear-search" aria-label="' + esc(t().clearSearch) + '">' + icon('x') + '</button>' : '') +
			'</div>';
	}

	function headerHTML() {
		var n = cartCount();
		var langItems = Object.keys(LANGS).map(function (k) {
			return '<button type="button" role="menuitemradio" aria-checked="' + (k === S.lang) + '" data-act="lang" data-lang="' + k + '" lang="' + k + '">' +
				'<span>' + esc(LANGS[k].label) + '</span>' + (k === S.lang ? icon('check') : '<span class="short">' + LANGS[k].short + '</span>') + '</button>';
		}).join('');
		return '<header class="hdr" id="aa-hdr"><div class="container">' +
			'<div class="hdr-row">' +
			'<img class="logo" src="' + esc(DATA.logo) + '" alt="">' +
			'<h1>' + esc(DATA.store) + '</h1>' +
			'<div class="search-desk">' + searchField('aa-search-d') + '</div>' +
			'<div class="hdr-actions">' +
			'<button type="button" class="btn btn-icon search-toggle" data-act="toggle-search" aria-label="' + esc(S.mobileSearch ? t().closeSearch : t().openSearch) + '">' + icon(S.mobileSearch ? 'x' : 'search') + '</button>' +
			'<div class="menu-wrap"><button type="button" class="btn btn-icon" data-act="lang-menu" aria-haspopup="menu" aria-expanded="' + S.langMenu + '" aria-label="' + esc(t().language) + '" title="' + esc(t().language) + '">' + icon('languages') + '</button>' +
			(S.langMenu ? '<div class="menu" role="menu">' + langItems + '</div>' : '') + '</div>' +
			'<button type="button" class="btn btn-icon cart-btn" data-act="open-order" aria-label="' + esc(t().viewOrder) + '" title="' + esc(t().order) + '">' + icon('bag') +
			(n ? '<span class="cart-badge tabular">' + n + '</span>' : '') + '</button>' +
			'</div></div>' +
			(S.mobileSearch ? '<div class="search-mobile">' + searchField('aa-search-m') + '</div>' : '') +
			'</div></header>';
	}

	function sidebarHTML() {
		var q = !!S.query.trim();
		return '<aside class="sidebar"><nav aria-label="' + esc(t().categories) + '"><h2>' + esc(t().categories) + '</h2><ul class="side-list">' +
			catList().map(function (c) {
				return '<li><button type="button" data-act="cat" data-cat="' + c.key + '" aria-current="' + (!q && S.cat === c.key) + '"><span>' + esc(c.name) + '</span><span class="count tabular">' + c.count + '</span></button></li>';
			}).join('') + '</ul></nav></aside>';
	}

	function toolbarHTML() {
		var q = !!S.query.trim();
		return '<div class="toolbar"><div class="chips" role="tablist" aria-label="' + esc(t().categories) + '">' +
			catList().map(function (c) {
				return '<button type="button" class="chip" data-act="cat" data-cat="' + c.key + '" aria-current="' + (!q && S.cat === c.key) + '">' + esc(c.name) + ' <span class="count tabular">' + c.count + '</span></button>';
			}).join('') + '</div>' +
			'<div class="cols-toggle">' +
			'<button type="button" data-act="cols" data-cols="1" aria-pressed="' + (S.cols === 1) + '" aria-label="' + esc(t().oneColumn) + '" title="' + esc(t().oneColumn) + '">' + icon('square') + '</button>' +
			'<button type="button" data-act="cols" data-cols="2" aria-pressed="' + (S.cols === 2) + '" aria-label="' + esc(t().twoColumns) + '" title="' + esc(t().twoColumns) + '">' + icon('grid2') + '</button>' +
			'</div></div>';
	}

	function stepperHTML(id, qty, small) {
		return '<div class="stepper' + (small ? ' stepper-sm' : '') + '" role="group" aria-label="' + esc(t().quantity) + '">' +
			'<button type="button" data-act="dec" data-id="' + id + '" aria-label="' + esc(qty === 1 ? t().remove : t().decrease) + '">' + icon(qty === 1 ? 'trash' : 'minus') + '</button>' +
			'<span class="qty tabular" aria-live="polite">' + qty + '</span>' +
			'<button type="button" data-act="inc" data-id="' + id + '" aria-label="' + esc(t().increase) + '"' + (qty >= 99 ? ' disabled' : '') + '>' + icon('plus') + '</button></div>';
	}

	function cardHTML(p) {
		var ph = p.photos[0];
		var qty = S.cart[p.id] || 0;
		return '<article class="card">' +
			'<button type="button" class="card-link" data-act="open-product" data-id="' + p.id + '">' +
			'<div class="card-img">' + (ph ? '<img src="' + esc(ph.thumb) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">' : '<span class="nophoto">' + icon('image') + '</span>') +
			(p.photos.length > 1 ? '<span class="badge">' + esc(t().photosCount(p.photos.length)) + '</span>' : '') + '</div>' +
			'<div class="card-body"><span class="card-name">' + esc(p.name) + '</span>' +
			(DATA.pricesHidden ? '' : '<span class="card-price tabular">' + esc(price(p.price)) + '</span>') + '</div>' +
			'</button>' +
			'<div class="card-foot">' + (qty
				? stepperHTML(p.id, qty)
				: '<button type="button" class="btn btn-soft btn-touch btn-block" data-act="add" data-id="' + p.id + '">' + icon('plus') + '<span>' + esc(t().addToOrder) + '</span></button>') +
			'</div></article>';
	}

	function mainHTML() {
		var list = visibleProducts();
		var q = S.query.trim();
		var heading = q ? '' : '<h2 class="section-title">' + esc(S.cat === 'all' ? t().allProducts : catName(S.cat)) + '<span class="count tabular">(' + list.length + ')</span></h2>';
		var body;
		if (!DATA.products.length) {
			body = '<div class="empty">' + icon('pkg') + '<p>' + esc(t().noProducts) + '</p></div>';
		} else if (!list.length) {
			body = '<div class="empty">' + icon('search') + '<p>' + esc(t().noResults(q)) + '</p></div>';
		} else {
			body = '<div class="grid' + (S.cols === 1 ? ' one' : '') + '">' + list.map(cardHTML).join('') + '</div>';
		}
		return toolbarHTML() + heading + body;
	}

	function footerHTML() {
		return '<footer class="footer"><div class="container"><div class="footer-grid">' +
			'<section><div class="brand"><img class="logo logo-lg" src="' + esc(DATA.logo) + '" alt=""><h2><bdi>' + esc(DATA.store) + '</bdi></h2></div></section>' +
			(DATA.whatsapp ? '<section><h3>' + esc(t().footerContact) + '</h3>' +
				'<a class="contact" href="https://wa.me/' + esc(DATA.whatsapp) + '" target="_blank" rel="noopener noreferrer"><span class="ic">' + WA + '</span>' +
				'<span class="t"><small>' + esc(t().footerWhatsapp) + '</small><bdi dir="ltr" class="tabular">' + esc(DATA.phoneLabel || DATA.whatsapp) + '</bdi></span></a></section>' : '') +
			'</div><p class="copy"><span class="tabular">© ' + new Date().getFullYear() + '</span> <bdi>' + esc(DATA.store) + '</bdi>. ' + esc(t().footerRights) + '</p></div></footer>';
	}

	function orderBarHTML() {
		var n = cartCount();
		if (!n || S.order || S.product) return '';
		return '<div class="orderbar"><button type="button" data-act="open-order"><span class="n tabular">' + n + '</span><span class="lbl">' + esc(t().viewOrder) + '</span>' +
			(DATA.pricesHidden ? '' : '<span class="tabular">' + esc(price(cartTotal())) + '</span>') + '</button></div>';
	}

	function productSheetHTML() {
		var p = byId[S.product];
		if (!p) return '';
		var inCart = S.cart[p.id] || 0;
		var qty = inCart || S.qty;
		var photos = p.photos;
		var idx = Math.min(S.photo, Math.max(0, photos.length - 1));
		var gallery = '<div><div class="gallery">' +
			(photos.length ? '<img src="' + esc(photos[idx].full) + '" alt="' + esc(photos.length > 1 ? t().photoOf(idx + 1, photos.length) : p.name) + '">' : '<span class="nophoto" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-2)">' + esc(t().noPhoto) + '</span>') +
			(photos.length > 1
				? '<button type="button" class="nav prev" data-act="photo" data-step="-1" aria-label="' + esc(t().prevPhoto) + '">' + icon('chevL') + '</button>' +
				  '<button type="button" class="nav next" data-act="photo" data-step="1" aria-label="' + esc(t().nextPhoto) + '">' + icon('chevR') + '</button>' +
				  '<div class="dots">' + photos.map(function (_, i) { return '<span class="' + (i === idx ? 'on' : '') + '"></span>'; }).join('') + '</div>'
				: '') + '</div>' +
			(photos.length > 1 ? '<div class="thumbs">' + photos.map(function (ph, i) {
				return '<button type="button" data-act="photo-at" data-i="' + i + '" aria-current="' + (i === idx) + '" aria-label="' + esc(t().photoOf(i + 1, photos.length)) + '"><img src="' + esc(ph.thumb) + '" alt=""></button>';
			}).join('') + '</div>' : '') + '</div>';

		var info = '<div class="pd-info">' +
			'<div><div class="pd-cat">' + esc(catName(p.categoryId)) + '</div><h2 class="pd-name" id="aa-pd-title">' + esc(p.name) + '</h2></div>' +
			(DATA.pricesHidden ? '' : '<div class="pd-price tabular">' + esc(price(p.price)) + '</div>') +
			(p.description ? '<div class="pd-desc"><h3>' + esc(t().description) + '</h3><p>' + esc(p.description) + '</p></div>' : '') +
			'<div class="pd-row"><span class="lbl">' + esc(inCart ? t().inOrder : t().quantity) + '</span>' +
			(inCart ? stepperHTML(p.id, inCart) :
				'<div class="stepper" role="group" aria-label="' + esc(t().quantity) + '">' +
				'<button type="button" data-act="pqty" data-step="-1" aria-label="' + esc(t().decrease) + '"' + (qty <= 1 ? ' disabled' : '') + '>' + icon('minus') + '</button>' +
				'<span class="qty tabular">' + qty + '</span>' +
				'<button type="button" data-act="pqty" data-step="1" aria-label="' + esc(t().increase) + '">' + icon('plus') + '</button></div>') +
			'</div>' +
			(DATA.pricesHidden ? '' : '<div class="pd-sub"><span>' + esc(t().subtotalLabel) + '</span><span class="tabular">' + esc(price(qty * p.price)) + '</span></div>') +
			'</div>';

		var foot = inCart
			? '<button type="button" class="btn btn-primary btn-touch btn-block" data-act="open-order">' + icon('bag') + esc(t().viewOrder) + '</button>'
			: '<button type="button" class="btn btn-primary btn-touch btn-block" data-act="order-this">' + icon('bag') + esc(t().orderThis) + '</button>';

		return '<div class="overlay" data-act="close-product-bg"><div class="sheet wide" role="dialog" aria-modal="true" aria-labelledby="aa-pd-title">' +
			'<div class="sheet-head"><button type="button" class="btn btn-icon" data-act="close-product" aria-label="' + esc(t().backToCatalog) + '">' + icon('x') + '</button><h2></h2></div>' +
			'<div class="sheet-body"><div class="pd">' + gallery + info + '</div></div>' +
			'<div class="sheet-foot">' + foot + '<p class="note">' + esc(t().whatsappNote) + '</p></div>' +
			'</div></div>';
	}

	function orderSheetHTML() {
		var ids = Object.keys(S.cart);
		var n = cartCount();
		var body, foot = '';
		if (S.confirmClear) {
			return '<div class="overlay" data-act="close-confirm-bg"><div class="sheet" role="alertdialog" aria-modal="true"><div class="confirm">' +
				'<p><strong>' + esc(t().clearOrder) + '</strong></p><p>' + esc(t().confirmClear) + '</p>' +
				'<div class="row"><button type="button" class="btn btn-ghost btn-touch" data-act="cancel-clear">' + esc(t().cancel) + '</button>' +
				'<button type="button" class="btn btn-touch" style="background:var(--danger);color:#fff" data-act="do-clear">' + esc(t().clear) + '</button></div>' +
				'</div></div></div>';
		}
		if (!ids.length) {
			body = '<div class="empty" style="padding:3rem 1rem">' + icon('bag') + '<p style="margin:0 0 .25rem;font-weight:600;color:var(--text)">' + esc(t().emptyOrder) + '</p><p style="margin:0">' + esc(t().emptyOrderHint) + '</p></div>';
		} else {
			body = '<ul class="order-list">' + ids.map(function (id) {
				var p = byId[id], q = S.cart[id], ph = p.photos[0];
				return '<li class="order-item">' +
					(ph ? '<img src="' + esc(ph.thumb) + '" alt="">' : '<span class="ph"></span>') +
					'<div class="info"><span class="nm">' + esc(p.name) + '</span>' +
					(DATA.pricesHidden ? '' : '<span class="sub tabular">' + esc(q + ' × ' + price(p.price)) + ' = ' + esc(price(q * p.price)) + '</span>') +
					stepperHTML(p.id, q, true) + '</div>' +
					'<button type="button" class="rm" data-act="remove" data-id="' + p.id + '" aria-label="' + esc(t().remove) + '">' + icon('x') + '</button>' +
					'</li>';
			}).join('') + '</ul>' +
				(DATA.pricesHidden ? '' : '<div class="order-total"><span>' + esc(t().total) + '</span><span class="v tabular">' + esc(price(cartTotal())) + '</span></div>') +
				'<div class="form">' +
				'<label>' + esc(t().fullName) + '<input type="text" id="aa-name" autocomplete="name" value="' + esc(S.form.name) + '"' + (S.nameErr ? ' aria-invalid="true"' : '') + '>' +
				(S.nameErr ? '<span class="err">' + esc(t().nameRequired) + '</span>' : '') + '</label>' +
				'<label><span>' + esc(t().orderNote) + ' <span class="opt">(' + esc(t().optional) + ')</span></span><textarea id="aa-note" rows="2">' + esc(S.form.note) + '</textarea></label>' +
				'</div>';
			foot = '<div class="sheet-foot">' +
				'<button type="button" class="btn btn-touch btn-block wa-btn" data-act="send">' + WA + esc(t().sendWhatsapp) + '</button>' +
				'<button type="button" class="btn btn-ghost-danger btn-touch btn-block" data-act="ask-clear">' + icon('trash') + esc(t().clearOrder) + '</button>' +
				'<p class="note">' + esc(t().whatsappNote) + '</p></div>';
		}
		return '<div class="overlay" data-act="close-order-bg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="aa-order-title">' +
			'<div class="sheet-head"><h2 id="aa-order-title">' + esc(t().order) + (n ? ' <span class="tabular" style="font-weight:400;color:var(--text-2);font-size:.875rem">· ' + esc(t().items(n)) + '</span>' : '') + '</h2>' +
			'<button type="button" class="btn btn-icon" data-act="close-order" aria-label="' + esc(t().close) + '">' + icon('x') + '</button></div>' +
			'<div class="sheet-body">' + body + '</div>' + foot + '</div></div>';
	}

	/* ---------------------------------------------------------------- render */
	var els = {};
	function mount() {
		root.innerHTML = '<div id="aa-h"></div><div class="container layout"><div id="aa-side"></div><main class="main" id="aa-main"></main></div><div id="aa-f"></div><div id="aa-bar"></div><div id="aa-modal"></div>';
		['h', 'side', 'main', 'f', 'bar', 'modal'].forEach(function (k) { els[k] = document.getElementById('aa-' + k); });
	}
	function applyLang() {
		var L = LANGS[S.lang];
		document.documentElement.lang = S.lang;
		document.documentElement.dir = L.dir;
		root.setAttribute('dir', L.dir);
	}
	function renderHeader() {
		var active = document.activeElement;
		var focusId = active && active.id && active.matches('[data-search]') ? active.id : null;
		var caret = focusId ? active.selectionStart : null;
		els.h.innerHTML = headerHTML();
		if (focusId) {
			var f = document.getElementById(focusId);
			if (f) { f.focus(); try { f.setSelectionRange(caret, caret); } catch (e) { /* ignore */ } }
		}
		var hdr = document.getElementById('aa-hdr');
		if (hdr) document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px');
	}
	function renderMain() { els.main.innerHTML = mainHTML(); els.side.innerHTML = sidebarHTML(); }
	function renderModal() {
		var html = S.product ? productSheetHTML() : (S.order ? orderSheetHTML() : '');
		els.modal.innerHTML = html;
		document.body.classList.toggle('aa-lock', !!html);
	}
	function renderBar() {
		els.bar.innerHTML = orderBarHTML();
		document.body.classList.toggle('has-orderbar', !!els.bar.innerHTML);
	}
	function renderAll() {
		applyLang();
		document.title = DATA.store;
		renderHeader(); renderMain(); renderModal(); renderBar();
		els.f.innerHTML = footerHTML();
	}
	function renderCartBits() { renderHeader(); renderMain(); renderModal(); renderBar(); }

	var toastTimer;
	function toast(msg) {
		var old = document.querySelector('.toast');
		if (old) old.remove();
		var d = document.createElement('div');
		d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg;
		document.body.appendChild(d);
		clearTimeout(toastTimer);
		toastTimer = setTimeout(function () { d.remove(); }, 1800);
	}

	/* ---------------------------------------------------------------- routing */
	function urlFor(id) {
		var u = new URL(window.location.href);
		if (id) u.searchParams.set('item', id); else u.searchParams.delete('item');
		return u.pathname + u.search + u.hash;
	}
	function openProduct(id, push) {
		if (!byId[id]) return;
		S.product = id; S.qty = 1; S.photo = 0; S.langMenu = false;
		if (push !== false) history.pushState({ item: id }, '', urlFor(id));
		renderModal(); renderBar();
	}
	function closeProduct(fromPop) {
		if (!S.product) return;
		S.product = null;
		if (!fromPop) {
			if (history.state && history.state.item) history.back();
			else history.replaceState(null, '', urlFor(null));
		}
		renderModal(); renderBar();
	}
	window.addEventListener('popstate', function () {
		var id = parseInt(new URL(window.location.href).searchParams.get('item'), 10);
		if (id && byId[id]) openProduct(id, false); else closeProduct(true);
	});

	/* ---------------------------------------------------------------- events */
	root.addEventListener('click', function (e) {
		var el = e.target.closest('[data-act]');
		if (!el || !root.contains(el)) {
			if (S.langMenu) { S.langMenu = false; renderHeader(); }
			return;
		}
		var act = el.getAttribute('data-act');
		var id = el.getAttribute('data-id');

		// Backdrop clicks only count when the backdrop itself was clicked.
		if (/-bg$/.test(act) && e.target !== el) return;

		if (act !== 'lang-menu' && S.langMenu) { S.langMenu = false; if (act !== 'lang') renderHeader(); }

		switch (act) {
			case 'lang':
				S.lang = el.getAttribute('data-lang'); save('lang', S.lang); S.langMenu = false; renderAll(); break;
			case 'lang-menu':
				S.langMenu = !S.langMenu; renderHeader(); break;
			case 'toggle-search':
				S.mobileSearch = !S.mobileSearch;
				if (!S.mobileSearch && S.query) { S.query = ''; renderMain(); }
				renderHeader();
				if (S.mobileSearch) { var m = document.getElementById('aa-search-m'); if (m) m.focus(); }
				break;
			case 'clear-search':
				S.query = ''; renderHeader(); renderMain(); break;
			case 'cat':
				var c = el.getAttribute('data-cat');
				S.cat = c === 'all' || c === 'other' ? c : parseInt(c, 10);
				S.query = '';
				renderHeader(); renderMain();
				window.scrollTo({ top: 0, behavior: 'smooth' });
				break;
			case 'cols':
				S.cols = parseInt(el.getAttribute('data-cols'), 10) === 1 ? 1 : 2; save('cols', S.cols); renderMain(); break;
			case 'open-product':
				openProduct(parseInt(id, 10)); break;
			case 'close-product': case 'close-product-bg':
				closeProduct(); break;
			case 'add':
				setQty(id, 1); renderCartBits(); toast(t().added); break;
			case 'inc':
				setQty(id, (S.cart[id] || 0) + 1); renderCartBits(); break;
			case 'dec':
				setQty(id, (S.cart[id] || 0) - 1); renderCartBits(); break;
			case 'remove':
				setQty(id, 0); renderCartBits(); break;
			case 'pqty':
				S.qty = Math.max(1, Math.min(99, S.qty + parseInt(el.getAttribute('data-step'), 10))); renderModal(); break;
			case 'photo':
				var p = byId[S.product]; var len = p.photos.length;
				var step = parseInt(el.getAttribute('data-step'), 10);
				S.photo = (S.photo + step + len) % len; renderModal(); break;
			case 'photo-at':
				S.photo = parseInt(el.getAttribute('data-i'), 10); renderModal(); break;
			case 'order-this':
				setQty(S.product, S.qty);
				closeProduct();
				S.order = true; renderCartBits(); break;
			case 'open-order':
				if (S.product) closeProduct();
				S.order = true; S.nameErr = false; renderModal(); renderBar(); break;
			case 'close-order': case 'close-order-bg':
				S.order = false; S.nameErr = false; renderModal(); renderBar(); break;
			case 'ask-clear':
				S.confirmClear = true; renderModal(); break;
			case 'cancel-clear': case 'close-confirm-bg':
				S.confirmClear = false; renderModal(); break;
			case 'do-clear':
				S.cart = {}; save('order', S.cart); S.confirmClear = false; renderCartBits(); break;
			case 'send':
				sendOrder(); break;
		}
	});

	root.addEventListener('input', function (e) {
		var el = e.target;
		if (el.matches('[data-search]')) {
			S.query = el.value;
			renderMain();
			// show/hide the clear (×) button without losing focus
			var wrap = el.parentNode, clr = wrap.querySelector('.clear');
			if (S.query && !clr) wrap.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn-icon clear" data-act="clear-search" aria-label="' + esc(t().clearSearch) + '">' + icon('x') + '</button>');
			if (!S.query && clr) clr.remove();
		} else if (el.id === 'aa-name') {
			S.form.name = el.value; save('form', S.form);
			if (S.nameErr && el.value.trim()) { S.nameErr = false; el.removeAttribute('aria-invalid'); var er = el.parentNode.querySelector('.err'); if (er) er.remove(); }
		} else if (el.id === 'aa-note') {
			S.form.note = el.value; save('form', S.form);
		}
	});

	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') return;
		if (S.langMenu) { S.langMenu = false; renderHeader(); }
		else if (S.confirmClear) { S.confirmClear = false; renderModal(); }
		else if (S.product) closeProduct();
		else if (S.order) { S.order = false; renderModal(); renderBar(); }
	});
	document.addEventListener('click', function (e) {
		// Ignore clicks whose target was just re-rendered away (e.g. the language button itself).
		if (!e.target.isConnected) return;
		if (S.langMenu && !root.contains(e.target)) { S.langMenu = false; renderHeader(); }
	});

	function sendOrder() {
		var tt = t();
		var name = S.form.name.trim().replace(/\s+/g, ' ');
		if (!name) {
			S.nameErr = true; renderModal();
			var f = document.getElementById('aa-name'); if (f) f.focus();
			return;
		}
		var note = S.form.note.trim();
		var lines = [tt.orderGreeting, tt.fullName + ': ' + name, ''];
		Object.keys(S.cart).forEach(function (id) {
			var p = byId[id], q = S.cart[id];
			lines.push('• ' + q + ' × ' + p.name + (DATA.pricesHidden ? '' : ' = ' + price(q * p.price)));
		});
		if (!DATA.pricesHidden) lines.push('', tt.total + ': ' + price(cartTotal()));
		if (note) lines.push('', tt.orderNote + ': ' + note);
		window.open('https://wa.me/' + DATA.whatsapp + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener,noreferrer');
	}

	/* ------------------------------------------------------------------ boot */
	mount();
	renderAll();
	var initial = parseInt(new URL(window.location.href).searchParams.get('item'), 10);
	if (initial && byId[initial]) openProduct(initial, false);
	window.addEventListener('resize', function () {
		var hdr = document.getElementById('aa-hdr');
		if (hdr) document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px');
	});
})();
