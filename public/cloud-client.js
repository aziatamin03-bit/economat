/**
 * cloud-client.js - عميل تخزين ومزامنة بيانات OBAYOLI
 */
(() => {
  const getStorageKey = (module) => `obayoli-${module}-manager-v1`;
  const getRevisionKey = (module) => `obayoli-${module}-revision`;
  const getStocktakesKey = (module) => `obayoli-${module}-general-stocktakes`;

  window.ObayoliCloud = window.ObayoliCloud || {
    getState: async function (moduleName) {
      try {
        const raw = localStorage.getItem(getStorageKey(moduleName));
        const rev = parseInt(localStorage.getItem(getRevisionKey(moduleName)) || '1', 10);
        const payload = raw ? JSON.parse(raw) : {};
        return { revision: rev, payload };
      } catch (e) {
        console.warn('Error reading local state:', e);
        return { revision: 1, payload: {} };
      }
    },

    saveState: async function (moduleName, payload, prevRevision) {
      try {
        const nextRev = (parseInt(prevRevision, 10) || 1) + 1;
        localStorage.setItem(getStorageKey(moduleName), JSON.stringify(payload));
        localStorage.setItem(getRevisionKey(moduleName), String(nextRev));
        return { revision: nextRev };
      } catch (e) {
        console.error('Error saving local state:', e);
        throw new Error('فشل حفظ البيانات في التخزين المحلي: ' + e.message);
      }
    },

    pollState: async function (moduleName) {
      const rev = parseInt(localStorage.getItem(getRevisionKey(moduleName)) || '1', 10);
      return { revision: rev };
    },

    request: async function (url, options = {}) {
      const method = (options.method || 'GET').toUpperCase();
      const body = options.body ? JSON.parse(options.body) : null;
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;

      // Handle stocktakes API
      if (pathname === '/api/stocktakes') {
        const raw = localStorage.getItem(getStocktakesKey('restaurant'));
        let stocktakes = raw ? JSON.parse(raw) : [];

        if (method === 'GET') {
          const from = urlObj.searchParams.get('from');
          const to = urlObj.searchParams.get('to');
          const employee = urlObj.searchParams.get('employee')?.toLowerCase();
          const material = urlObj.searchParams.get('material')?.toLowerCase();

          let filtered = [...stocktakes];
          if (from) filtered = filtered.filter(s => s.createdAt >= from);
          if (to) filtered = filtered.filter(s => s.createdAt <= to + 'T23:59:59');
          if (employee) filtered = filtered.filter(s => s.createdBy?.name?.toLowerCase().includes(employee));
          if (material) {
            filtered = filtered.filter(s => s.items?.some(item =>
              item.name?.toLowerCase().includes(material) ||
              item.barcode?.toLowerCase().includes(material)
            ));
          }
          return { stocktakes: filtered };
        }

        if (method === 'POST') {
          // Create draft general stocktake
          const stateRaw = localStorage.getItem(getStorageKey('restaurant'));
          const state = stateRaw ? JSON.parse(stateRaw) : { materials: [], movements: [] };
          const materials = state.materials || [];

          const items = materials.map(mat => {
            const movements = (state.movements || []).filter(m => String(m.materialId) === String(mat.id));
            const purchases = movements
              .filter(m => m.type === 'in' && String(m.note || '').startsWith('فاتورة '))
              .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
            const consumption = movements
              .filter(m => m.type === 'out')
              .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
            const waste = movements
              .filter(m => m.type === 'waste')
              .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
            const incoming = movements
              .filter(m => m.type === 'in')
              .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
            const outgoing = movements
              .filter(m => m.type === 'out')
              .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
            const opening = (Number(mat.quantity) || 0) - incoming + outgoing + waste;
            const theoretical = Number(mat.quantity) || 0;

            return {
              materialId: mat.id,
              name: mat.name,
              barcode: mat.barcode || '',
              category: mat.category || '',
              unit: mat.unit || 'kg',
              openingQuantity: opening,
              purchasesQuantity: purchases,
              consumptionQuantity: consumption,
              wasteQuantity: waste,
              theoreticalQuantity: theoretical,
              actualQuantity: null,
              variance: null,
              varianceValue: null,
              unitCost: Number(mat.cost) || 0,
              reason: '',
              notes: ''
            };
          });

          const newStocktake = {
            id: 'st-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            number: 'GRD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + (stocktakes.length + 1),
            status: 'draft',
            createdAt: new Date().toISOString(),
            createdBy: { name: body?.employeeName || 'مسؤول الجرد' },
            approvedBy: null,
            notes: body?.notes || '',
            correctionOf: body?.correctionOf || null,
            items
          };

          stocktakes.unshift(newStocktake);
          localStorage.setItem(getStocktakesKey('restaurant'), JSON.stringify(stocktakes));
          return { stocktake: newStocktake };
        }
      }

      // Update draft stocktake
      const matchUpdate = pathname.match(/^\/api\/stocktakes\/([^\/]+)$/);
      if (matchUpdate && method === 'PUT') {
        const id = decodeURIComponent(matchUpdate[1]);
        const raw = localStorage.getItem(getStocktakesKey('restaurant'));
        let stocktakes = raw ? JSON.parse(raw) : [];
        const index = stocktakes.findIndex(s => s.id === id);
        if (index === -1) throw new Error('سجل الجرد غير موجود');

        const current = stocktakes[index];
        if (body.notes !== undefined) current.notes = body.notes;
        if (Array.isArray(body.items)) {
          body.items.forEach(inputItem => {
            const existing = current.items.find(i => i.materialId === inputItem.materialId);
            if (existing) {
              existing.actualQuantity = inputItem.actualQuantity;
              existing.reason = inputItem.reason || '';
              existing.notes = inputItem.notes || '';
              if (inputItem.actualQuantity !== null && inputItem.actualQuantity !== undefined) {
                const diff = Number(inputItem.actualQuantity) - Number(existing.theoreticalQuantity);
                existing.variance = Number(diff.toFixed(4));
                existing.varianceValue = Number((diff * Number(existing.unitCost)).toFixed(2));
              }
            }
          });
        }
        stocktakes[index] = current;
        localStorage.setItem(getStocktakesKey('restaurant'), JSON.stringify(stocktakes));
        return { stocktake: current };
      }

      // Approve stocktake
      const matchApprove = pathname.match(/^\/api\/stocktakes\/([^\/]+)\/approve$/);
      if (matchApprove && method === 'POST') {
        const id = decodeURIComponent(matchApprove[1]);
        const raw = localStorage.getItem(getStocktakesKey('restaurant'));
        let stocktakes = raw ? JSON.parse(raw) : [];
        const index = stocktakes.findIndex(s => s.id === id);
        if (index === -1) throw new Error('سجل الجرد غير موجود');

        const current = stocktakes[index];
        current.status = 'approved';
        current.approvedBy = { name: 'المشرف المعتمد' };
        current.approvedAt = new Date().toISOString();

        // Apply adjustments to restaurant state
        const stateRaw = localStorage.getItem(getStorageKey('restaurant'));
        const state = stateRaw ? JSON.parse(stateRaw) : { materials: [], movements: [], stocktakes: [] };

        current.items.forEach(item => {
          if (item.actualQuantity !== null && item.actualQuantity !== undefined) {
            const mat = (state.materials || []).find(m => m.id === item.materialId);
            if (mat) {
              const diff = Number(item.actualQuantity) - Number(mat.quantity);
              if (Math.abs(diff) > 0.0001) {
                const movType = diff > 0 ? 'in' : 'out';
                const movQty = Math.abs(diff);
                mat.quantity = Number(item.actualQuantity);
                state.movements.unshift({
                  id: 'mov-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                  materialId: mat.id,
                  materialName: mat.name,
                  unit: mat.unit,
                  type: movType,
                  quantity: movQty,
                  cost: Number(mat.cost) || 0,
                  note: `تسوية جرد عام (${current.number})${item.reason ? ` - ${item.reason}` : ''}`,
                  date: new Date().toISOString().slice(0, 10),
                  reference: current.id,
                  department: '',
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        });

        localStorage.setItem(getStorageKey('restaurant'), JSON.stringify(state));
        const rev = parseInt(localStorage.getItem(getRevisionKey('restaurant')) || '1', 10) + 1;
        localStorage.setItem(getRevisionKey('restaurant'), String(rev));

        stocktakes[index] = current;
        localStorage.setItem(getStocktakesKey('restaurant'), JSON.stringify(stocktakes));
        return { success: true, stocktake: current };
      }

      // Admin export
      if (pathname === '/api/admin/state/restaurant/export') {
        const stateRaw = localStorage.getItem(getStorageKey('restaurant'));
        const stocktakesRaw = localStorage.getItem(getStocktakesKey('restaurant'));
        return {
          exportedAt: new Date().toISOString(),
          state: stateRaw ? JSON.parse(stateRaw) : {},
          generalStocktakes: stocktakesRaw ? JSON.parse(stocktakesRaw) : []
        };
      }

      // Admin import
      if (pathname === '/api/admin/state/restaurant/import') {
        if (!body || !body.state) throw new Error('بيانات غير صالحة');
        localStorage.setItem(getStorageKey('restaurant'), JSON.stringify(body.state));
        if (body.generalStocktakes) {
          localStorage.setItem(getStocktakesKey('restaurant'), JSON.stringify(body.generalStocktakes));
        }
        const rev = parseInt(localStorage.getItem(getRevisionKey('restaurant')) || '1', 10) + 1;
        localStorage.setItem(getRevisionKey('restaurant'), String(rev));
        return { success: true, revision: rev };
      }

      // Admin reset
      if (pathname === '/api/admin/state/restaurant/reset') {
        localStorage.removeItem(getStorageKey('restaurant'));
        localStorage.removeItem(getStocktakesKey('restaurant'));
        localStorage.setItem(getRevisionKey('restaurant'), '1');
        return { success: true };
      }

      throw new Error(`Endpoint not found: ${pathname}`);
    }
  };
})();
