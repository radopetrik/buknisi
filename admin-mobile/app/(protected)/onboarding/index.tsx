import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function OnboardingIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(protected)/onboarding/basic");
  }, [router]);

  return null;
}
