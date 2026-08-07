import { defineComponent } from "convex/server";

// Local component definition - "convex/betterAuth" is a locally installed
// component so we can extend the auth schema (role field) and add triggers.
const component = defineComponent("betterAuth");

export default component;
