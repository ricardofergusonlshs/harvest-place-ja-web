import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  BookOpen,
  Carrot,
  CheckCircle2,
  ChefHat,
  Flame,
  Leaf,
  Lightbulb,
  ShoppingBag,
  Sparkles,
  Sprout,
  Utensils,
} from 'lucide-react';
import { Badge, Card, SectionHeader } from '@/components/ui';

type Ingredient = {
  title: string;
  copy: string;
  uses: string[];
  tip: string;
  icon: LucideIcon;
};

const ingredients: Ingredient[] = [
  {
    title: 'Callaloo',
    copy: 'Iron-rich greens for sautés, patties, wraps, breakfast bowls, and simple Jamaican-style sides.',
    uses: ['Breakfast', 'Wraps', 'Rice bowls'],
    tip: 'Cook lightly with onion, garlic, thyme, and a small amount of pepper.',
    icon: Leaf,
  },
  {
    title: 'Green banana',
    copy: 'A hearty staple that works well boiled, mashed, sliced, or added to vegan meal prep bowls.',
    uses: ['Boiled meals', 'Meal prep', 'Stews'],
    tip: 'Pair with callaloo, pumpkin, beans, or plant-based protein for a filling plate.',
    icon: Apple,
  },
  {
    title: 'Breadfruit',
    copy: 'Roast, bake, or air-fry for a premium plant-based centerpiece with a satisfying texture.',
    uses: ['Roasting', 'Air-frying', 'Dinner plates'],
    tip: 'Serve with vegan sauce, fresh salad, or spicy roasted vegetables.',
    icon: Sprout,
  },
  {
    title: 'Scotch bonnet',
    copy: 'A powerful Jamaican pepper used for authentic heat, fragrance, and depth of flavor.',
    uses: ['Sauces', 'Stews', 'Marinades'],
    tip: 'Use sparingly. Add whole for flavor, or finely chop a tiny amount for heat.',
    icon: Flame,
  },
  {
    title: 'Pumpkin',
    copy: 'Excellent for soup, roasting, purees, stews, and creamy vegan sauces.',
    uses: ['Soups', 'Sauces', 'Roasting'],
    tip: 'Blend cooked pumpkin with garlic, herbs, and coconut milk for a rich vegan sauce.',
    icon: Carrot,
  },
  {
    title: 'Cho cho',
    copy: 'Light, crisp, and mild, making it excellent for stews, salads, sautéed sides, and soups.',
    uses: ['Salads', 'Stews', 'Soups'],
    tip: 'Slice thinly for salads or add near the end of cooking to keep some texture.',
    icon: Sparkles,
  },
];

const mealIdeas = [
  'Callaloo breakfast bowl with roasted breadfruit',
  'Green banana and pumpkin stew',
  'Cho cho salad with citrus dressing',
  'Breadfruit wedges with spicy vegan dip',
  'Pumpkin coconut soup with fresh herbs',
  'Callaloo wraps with beans and sweet pepper',
] as const;

export default function VeganIngredientBookPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_52%,#FFFEFC_100%)] text-[#1E2A21]">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <IngredientHero />

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <QuickCard
            icon={Leaf}
            title="Plant-based staples"
            text="Learn how Jamaican ingredients can support vegan cooking, meal prep, and family meals."
          />

          <QuickCard
            icon={ChefHat}
            title="Cooking confidence"
            text="Each ingredient includes practical uses and a simple kitchen tip."
          />

          <QuickCard
            icon={ShoppingBag}
            title="Shop connected"
            text="Use the guide as a companion to the marketplace when choosing fresh produce."
          />
        </section>

        <div className="mt-8">
          <SectionHeader
            eyebrow="Ingredient guide"
            title="Vegan ingredient book"
            subtitle="A premium educational guide for Jamaican plant-based ingredients, cooking ideas, and fresh market shopping."
          />
        </div>

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ingredient) => (
            <IngredientCard key={ingredient.title} ingredient={ingredient} />
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
            <Badge tone="gold">
              <Utensils className="h-3 w-3" />
              Meal ideas
            </Badge>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
              Simple vegan meal inspiration
            </h2>

            <div className="mt-6 grid gap-3">
              {mealIdeas.map((idea) => (
                <div
                  key={idea}
                  className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-black text-[#183B28]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2D6741] text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {idea}
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[30px] border border-[#D8E5D4] bg-[#183B28] p-6 text-white shadow-[0_24px_70px_rgba(24,59,40,0.16)] sm:p-8">
            <Badge tone="gold">
              <Lightbulb className="h-3 w-3" />
              Kitchen tip
            </Badge>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">
              Build vegan meals around local staples.
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/76">
              Start with one filling base like green banana, breadfruit, yam, rice, or pumpkin. Add greens such as callaloo, then finish with herbs, citrus, beans, or a small amount of Scotch bonnet for flavor.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full bg-[#FFF3D9] px-5 py-3 text-sm font-black text-[#183B28] transition hover:bg-white"
              >
                Shop ingredients
              </Link>

              <Link
                href="/weekly-box"
                className="inline-flex items-center justify-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/18"
              >
                Build weekly box
              </Link>
            </div>
          </Card>
        </section>

        <Card className="mt-8 rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] sm:p-8">
          <div className="rounded-[24px] border border-[#DFA75A]/35 bg-[#FFF3D9] p-5">
            <div className="flex gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#8B5D18]">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#183B28]">
                  Guide note
                </h2>

                <p className="mt-2 text-sm font-semibold leading-7 text-[#5F6A62]">
                  This page is an educational shopping companion. Customers should still review product details, allergies, freshness, and preparation needs before purchasing or cooking.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function IngredientHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#183B28] px-6 py-7 text-white shadow-[0_30px_90px_rgba(24,59,40,0.20)] sm:px-8 lg:px-10">
      <div className="absolute right-[-100px] top-[-120px] h-72 w-72 rounded-full bg-[#2D6741] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-[#DFA75A] opacity-25 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge tone="gold">
            <Leaf className="h-3 w-3" />
            Vegan ingredient guide
          </Badge>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Learn Jamaican plant-based ingredients.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/78 sm:text-base">
            Explore local staples, cooking uses, meal ideas, and simple tips for building fresh vegan meals from the market.
          </p>
        </div>

        <div className="rounded-3xl border border-white/12 bg-white/10 p-5 text-white backdrop-blur lg:max-w-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DFA75A]">
            Guide focus
          </p>

          <p className="mt-3 text-2xl font-black tracking-[-0.035em]">
            Fresh, local, plant-based
          </p>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/74">
            Use this guide to plan meals, choose produce, and shop with more confidence.
          </p>
        </div>
      </div>
    </section>
  );
}

function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const Icon = ingredient.icon;

  return (
    <Card className="rounded-[30px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(24,59,40,0.10)]">
      <Badge tone="green">Plant-based</Badge>

      <div className="mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        <Icon className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#183B28]">
        {ingredient.title}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
        {ingredient.copy}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {ingredient.uses.map((use) => (
          <span
            key={use}
            className="rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-3 py-1 text-xs font-black text-[#2D6741]"
          >
            {use}
          </span>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-[#DFA75A]/35 bg-[#FFF3D9] p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8B5D18]">
          Tip
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
          {ingredient.tip}
        </p>
      </div>
    </Card>
  );
}

function QuickCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <Card className="rounded-[28px] border border-[#D8E5D4] bg-white p-6 shadow-[0_18px_50px_rgba(24,59,40,0.07)]">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAF5E7] text-[#2D6741]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#183B28]">
        {title}
      </h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">
        {text}
      </p>
    </Card>
  );
}