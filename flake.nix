{
  description = "by rote";
  inputs = {
    nixpkgs.url = "nixpkgs/nixos-22.05";
    flake-utils.url = github:numtide/flake-utils;
  };
  outputs = { self, nixpkgs, flake-utils }:
    with flake-utils.lib; eachSystem allSystems (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        # defaultPackage = packages.document;
        devShell = pkgs.mkShell {
          # development environment
          buildInputs = [
            pkgs.nodejs-16_x
            pkgs.yarn
          ];
          PORT = "9501";
        };
      });
}
