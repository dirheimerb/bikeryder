import { Redirect } from 'expo-router';

// The root layout's navigator handles auth redirects; this just points the
// initial route at the main tabs.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
