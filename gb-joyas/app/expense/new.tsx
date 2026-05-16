// app/expense/new.tsx
// Esta pantalla es un alias — los gastos se agregan desde el modal dentro de expenses.tsx
// Se deja este archivo para rutas directas si se necesita en el futuro

import { Redirect } from 'expo-router';
export default function NewExpenseScreen() {
  return <Redirect href="/(tabs)/expenses" />;
}
