import { Toaster } from "@/components/ui/sonner";
import CustomCursor from "./components/CustomCursor";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import UIDesign from "./pages/UIDesign";
import ThreeDMotion from "./pages/ThreeDMotion";
import ProductDesign from "./pages/ProductDesign";
import Loading from "./pages/Loading";
import BudgetApp from "./pages/BudgetApp";
import TarotApp from "./pages/TarotApp";
import RedBullProject from "./pages/RedBullProject";
import KeyboardProject from "./pages/KeyboardProject";
import JellyFlowerProject from "./pages/JellyFlowerProject";


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/ui-design"} component={UIDesign} />
      <Route path={"/3d-motion"} component={ThreeDMotion} />
      <Route path={"/product-design"} component={ProductDesign} />
      <Route path={"/budget-app"} component={BudgetApp} />
      <Route path={"/tarot-arcana"} component={TarotApp} />
      <Route path={"/product-design/redbull"} component={RedBullProject} />
      <Route path={"/product-design/keyboard"} component={KeyboardProject} />
      <Route path={"/3d-motion/jellyflower"} component={JellyFlowerProject} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <CustomCursor />
          <Toaster />
          <Loading />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
