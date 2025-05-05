module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      ["babel-preset-expo", { 
        jsxImportSource: "nativewind", 
        lazyImports: true 
      }]
    ],
    plugins: [
      // Configuration simplifiée de react-native-dotenv
      ["module:react-native-dotenv"], 
      
      // Nativewind en PRESET (solution temporaire)
      // "nativewind/babel" ← COMMENTÉ
      
      // module-resolver
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: { "@": "./src" }
        }
      ]
    ]
  };
};