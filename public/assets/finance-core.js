(function(root){
  function monthly(annualRate){
    return Math.pow(1 + Number(annualRate || 0), 1 / 12) - 1;
  }

  function irDays(days){
    const d = Number(days || 0);
    return d <= 180 ? 0.225 : d <= 360 ? 0.20 : d <= 720 ? 0.175 : 0.15;
  }

  function loanPay(pv, monthlyRate, periods){
    const principal = Math.max(0, Number(pv || 0));
    const n = Math.max(0, Math.round(Number(periods || 0)));
    const m = Number(monthlyRate || 0);
    if (!n) return 0;
    if (Math.abs(m) < 1e-12) return principal / n;
    return principal * m / (1 - Math.pow(1 + m, -n));
  }

  function loanBalance(pv, monthlyRate, periods, elapsed){
    const principal = Math.max(0, Number(pv || 0));
    const n = Math.max(0, Math.round(Number(periods || 0)));
    const k = Math.max(0, Math.min(n, Math.round(Number(elapsed || 0))));
    const m = Number(monthlyRate || 0);
    if (!n) return 0;
    const pay = loanPay(principal, m, n);
    if (Math.abs(m) < 1e-12) return Math.max(0, principal - pay * k);
    return Math.max(0, principal * Math.pow(1 + m, k) - pay * (Math.pow(1 + m, k) - 1) / m);
  }

  function loanFlow(pv, monthlyRate, periods, system = "price", monthlyExtra = 0){
    const principal = Math.max(0, Number(pv || 0));
    const n = Math.max(0, Math.round(Number(periods || 0)));
    const m = Number(monthlyRate || 0);
    const extra = Number(monthlyExtra || 0);
    let balance = principal;
    const flows = [];
    let interest = 0;
    let first = 0;
    let last = 0;
    const amort = n ? principal / n : 0;
    const price = n ? loanPay(principal, m, n) : 0;

    for(let k = 1; k <= n; k++){
      const j = balance * m;
      let pay;
      if(system === "sac"){
        const a = Math.min(amort, balance);
        pay = a + j;
        balance = Math.max(0, balance - a);
      } else {
        pay = price;
        const a = Math.max(0, pay - j);
        balance = Math.max(0, balance - a);
      }
      interest += j;
      pay += extra;
      if(k === 1) first = pay;
      if(k === n) last = pay;
      flows.push(pay);
    }

    return {
      flows,
      interest,
      first,
      last,
      total:flows.reduce((sum, value) => sum + value, 0),
      endingBalance:balance
    };
  }

  function pvFlows(flows, annualRate, startMonth = 1){
    const d = monthly(Math.max(-0.99, Number(annualRate || 0)));
    return (flows || []).reduce((sum, value, index) => sum + Number(value || 0) / Math.pow(1 + d, index + startMonth), 0);
  }

  function fv(principal, contribution, annualRate, periods){
    const m = monthly(Number(annualRate || 0));
    let balance = Number(principal || 0);
    const pmt = Number(contribution || 0);
    const n = Math.max(0, Math.round(Number(periods || 0)));
    for(let k = 0; k < n; k++) balance = balance * (1 + m) + pmt;
    return balance;
  }

  function taxLots(principal, contribution, annualRate, periods){
    const P = Number(principal || 0);
    const pmt = Number(contribution || 0);
    const N = Math.max(0, Math.round(Number(periods || 0)));
    const m = monthly(Number(annualRate || 0));
    let gross = P * Math.pow(1 + m, N);
    let tax = Math.max(0, gross - P) * irDays(N * 30);

    for(let k = 0; k < N; k++){
      const age = N - 1 - k;
      const end = pmt * Math.pow(1 + m, age);
      const gain = end - pmt;
      gross += end;
      if(gain > 0) tax += gain * irDays(Math.max(1, age * 30));
    }

    return { gross, tax, net:gross - tax, invested:P + pmt * N };
  }

  function fixedIncomeProduct(name, type, rateValue, feePct, lockDays, principal, contribution, periods, cdi, inflation){
    const cdiBased = String(type).startsWith("cdi");
    const taxed = String(type).endsWith("taxed");
    const annualGross = cdiBased ? Number(cdi || 0) * (Number(rateValue || 0) / 100) : Number(rateValue || 0) / 100;
    const annual = Math.max(-0.99, annualGross - Number(feePct || 0) / 100);
    const calc = taxed ? taxLots(principal, contribution, annual, periods) : null;
    const gross = taxed ? calc.gross : fv(principal, contribution, annual, periods);
    const tax = taxed ? calc.tax : 0;
    const net = taxed ? calc.net : gross;
    const invested = Number(principal || 0) + Number(contribution || 0) * Number(periods || 0);
    const eligible = Number(periods || 0) * 30 >= Number(lockDays || 0);
    const real = net / Math.pow(1 + Number(inflation || 0), Number(periods || 0) / 12);
    return {
      name,type,rateValue,feePct,lockDays,cdiBased,taxed,annual,gross,tax,net,invested,
      gain:net - invested,real,eligible
    };
  }

  function solveRate(fn, target, lo = -0.99, hi = 3){
    let low = Number(lo), high = Number(hi);
    for(let i = 0; i < 70; i++){
      const mid = (low + high) / 2;
      if(fn(mid) > target) high = mid;
      else low = mid;
    }
    return (low + high) / 2;
  }

  root.AmareloFinance = Object.freeze({
    monthly,
    irDays,
    loanPay,
    loanBalance,
    loanFlow,
    pvFlows,
    fv,
    taxLots,
    fixedIncomeProduct,
    solveRate
  });
})(globalThis);
