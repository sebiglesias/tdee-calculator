// TDEE Calculator & Daily Macro Tracker
(function() {
  'use strict';

  let state = {
    unit: 'imperial', // 'imperial' | 'metric'
    sex: 'male',      // 'male' | 'female'
    formula: 'mifflin',
    age: 28,
    weightLbs: 165,
    heightFeet: 5,
    heightInches: 10,
    weightKg: 75,
    heightCm: 178,
    activity: 1.55,
    goal: -350
  };

  function getMetricValues() {
    if (state.unit === 'metric') {
      return { kg: state.weightKg, cm: state.heightCm };
    } else {
      const kg = state.weightLbs * 0.45359237;
      const cm = ((state.heightFeet * 12) + state.heightInches) * 2.54;
      return { kg, cm };
    }
  }

  function calculateBMR() {
    const { kg, cm } = getMetricValues();
    const { sex, formula, age } = state;

    if (formula === 'mifflin') {
      const base = (10 * kg) + (6.25 * cm) - (5 * age);
      return sex === 'male' ? base + 5 : base - 161;
    } else {
      // Revised Harris-Benedict
      if (sex === 'male') {
        return 88.362 + (13.397 * kg) + (4.799 * cm) - (5.677 * age);
      } else {
        return 447.593 + (9.247 * kg) + (3.098 * cm) - (4.330 * age);
      }
    }
  }

  function recalculate() {
    const { kg } = getMetricValues();
    const bmr = Math.round(calculateBMR());
    const tdee = Math.round(bmr * state.activity);
    let targetCalories = Math.round(tdee + state.goal);

    const minCals = state.sex === 'male' ? 1400 : 1200;
    if (targetCalories < minCals) targetCalories = minCals;

    // Macro logic
    let pRatio = 2.0; // g per kg (~0.9g per lb)
    if (state.goal < -400) pRatio = 2.2;
    else if (state.goal > 0) pRatio = 1.8;

    let proteinGrams = Math.round(kg * pRatio);
    let proteinKcal = proteinGrams * 4;

    let fatGrams = Math.round(kg * 0.9);
    if (fatGrams * 9 < targetCalories * 0.2) {
      fatGrams = Math.round((targetCalories * 0.2) / 9);
    }
    let fatKcal = fatGrams * 9;

    let remainingKcal = targetCalories - proteinKcal - fatKcal;
    if (remainingKcal < 0) remainingKcal = 0;
    let carbsGrams = Math.round(remainingKcal / 4);
    let carbsKcal = carbsGrams * 4;

    const actualKcal = proteinKcal + fatKcal + carbsKcal;
    const pPct = Math.round((proteinKcal / actualKcal) * 100);
    const fPct = Math.round((fatKcal / actualKcal) * 100);
    const cPct = 100 - pPct - fPct;

    // DOM Updates
    document.getElementById('res-target-calories').textContent = targetCalories.toLocaleString('en-US');
    document.getElementById('res-bmr').textContent = `${bmr.toLocaleString('en-US')} kcal`;
    document.getElementById('res-tdee').textContent = `${tdee.toLocaleString('en-US')} kcal`;

    document.getElementById('macro-protein-g').textContent = `${proteinGrams} g`;
    document.getElementById('macro-protein-kcal').textContent = `${proteinKcal} kcal (${pPct}%)`;

    document.getElementById('macro-carbs-g').textContent = `${carbsGrams} g`;
    document.getElementById('macro-carbs-kcal').textContent = `${carbsKcal} kcal (${cPct}%)`;

    document.getElementById('macro-fats-g').textContent = `${fatGrams} g`;
    document.getElementById('macro-fats-kcal').textContent = `${fatKcal} kcal (${fPct}%)`;

    document.getElementById('seg-protein').style.width = `${pPct}%`;
    document.getElementById('seg-carbs').style.width = `${cPct}%`;
    document.getElementById('seg-fats').style.width = `${fPct}%`;

    document.getElementById('leg-protein').textContent = `Protein: ${pPct}%`;
    document.getElementById('leg-carbs').textContent = `Carbs: ${cPct}%`;
    document.getElementById('leg-fats').textContent = `Fats: ${fPct}%`;

    document.getElementById('meal-breakfast').textContent = `${Math.round(targetCalories * 0.25)} kcal`;
    document.getElementById('meal-lunch').textContent = `${Math.round(targetCalories * 0.35)} kcal`;
    document.getElementById('meal-snack').textContent = `${Math.round(targetCalories * 0.15)} kcal`;
    document.getElementById('meal-dinner').textContent = `${Math.round(targetCalories * 0.25)} kcal`;

    localStorage.setItem('tdee_calc_state', JSON.stringify(state));
  }

  function setUnit(newUnit) {
    state.unit = newUnit;
    document.querySelectorAll('.unit-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.unit === newUnit);
    });

    const imperialInputs = document.getElementById('inputs-imperial');
    const metricInputs = document.getElementById('inputs-metric');

    if (newUnit === 'imperial') {
      imperialInputs.style.display = 'grid';
      metricInputs.style.display = 'none';
    } else {
      imperialInputs.style.display = 'none';
      metricInputs.style.display = 'grid';
    }
    recalculate();
  }

  function init() {
    const saved = localStorage.getItem('tdee_calc_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      } catch (e) {}
    }

    // Bind inputs
    const inputAge = document.getElementById('input-age');
    const inputLbs = document.getElementById('input-weight-lbs');
    const inputFeet = document.getElementById('input-height-ft');
    const inputInches = document.getElementById('input-height-in');
    const inputKg = document.getElementById('input-weight-kg');
    const inputCm = document.getElementById('input-height-cm');
    const selectActivity = document.getElementById('select-activity');
    const selectFormula = document.getElementById('select-formula');

    inputAge.value = state.age;
    inputLbs.value = state.weightLbs;
    inputFeet.value = state.heightFeet;
    inputInches.value = state.heightInches;
    inputKg.value = state.weightKg;
    inputCm.value = state.heightCm;
    selectActivity.value = state.activity;
    if (selectFormula) selectFormula.value = state.formula;

    inputAge.addEventListener('input', (e) => {
      state.age = Math.max(12, Math.min(100, parseFloat(e.target.value) || 25));
      recalculate();
    });

    inputLbs.addEventListener('input', (e) => {
      state.weightLbs = Math.max(60, Math.min(600, parseFloat(e.target.value) || 160));
      state.weightKg = Math.round(state.weightLbs * 0.453592);
      inputKg.value = state.weightKg;
      recalculate();
    });

    inputFeet.addEventListener('input', (e) => {
      state.heightFeet = Math.max(3, Math.min(7, parseFloat(e.target.value) || 5));
      recalculate();
    });

    inputInches.addEventListener('input', (e) => {
      state.heightInches = Math.max(0, Math.min(11, parseFloat(e.target.value) || 0));
      recalculate();
    });

    inputKg.addEventListener('input', (e) => {
      state.weightKg = Math.max(30, Math.min(260, parseFloat(e.target.value) || 70));
      state.weightLbs = Math.round(state.weightKg / 0.453592);
      inputLbs.value = state.weightLbs;
      recalculate();
    });

    inputCm.addEventListener('input', (e) => {
      state.heightCm = Math.max(100, Math.min(240, parseFloat(e.target.value) || 175));
      recalculate();
    });

    selectActivity.addEventListener('change', (e) => {
      state.activity = parseFloat(e.target.value);
      recalculate();
    });

    if (selectFormula) {
      selectFormula.addEventListener('change', (e) => {
        state.formula = e.target.value;
        recalculate();
      });
    }

    // Units toggle
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setUnit(btn.dataset.unit);
      });
    });

    // Sex toggle
    const sexBtns = document.querySelectorAll('.sex-btn');
    sexBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sex === state.sex);
      btn.addEventListener('click', () => {
        sexBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.sex = btn.dataset.sex;
        recalculate();
      });
    });

    // Goals toggle
    const goalCards = document.querySelectorAll('.goal-card');
    goalCards.forEach(card => {
      const delta = parseInt(card.dataset.delta, 10);
      card.classList.toggle('active', delta === state.goal);
      card.addEventListener('click', () => {
        goalCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.goal = delta;
        recalculate();
      });
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        item.classList.toggle('open');
      });
    });

    setUnit(state.unit);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
