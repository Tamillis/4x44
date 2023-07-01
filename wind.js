export class Wind {
    constructor(dims, windVector, seaLevel) {
        this.oldGrid = [];

        for (let i = 0; i < dims; i++) {
            this.oldGrid[i] = [];
        }

        this.windVector = { ...windVector };

        //and make it a unit vector
        this.windVector.x /= Math.sqrt(this.windVector.x * this.windVector.x + this.windVector.y * this.windVector.y);
        this.windVector.y /= Math.sqrt(this.windVector.x * this.windVector.x + this.windVector.y * this.windVector.y);

        this.seaLevel = seaLevel;
    }

    blow(grid, spreadProp, frictionProp, iterations = 5) {

        for (let n = 0; n < iterations; n++) {
            for (let i = 0; i < grid.length; i++) {
                for (let j = 0; j < grid[i].length; j++) {
                    this.oldGrid[i][j] = grid[i][j][spreadProp];
                }
            }

            /*
            //now if I were to do a full fluid simulation it might look like this:
            this.diffuse(grid, prop);
            this.project(grid, prop);
            this.advect(grid, prop);
            //but I'm not so I'm just going to cook up my own simple spreader based on the wind vector and the altVal
            */

            for (let i = 1; i < grid.length-1; i++) {
                for (let j = 1; j < grid[i].length-1; j++) {
                    this.propagate(grid, i, j, spreadProp, frictionProp);
                }
            }

            //and reset edge tiles to their old values
            for (let n = 0; n < grid.length; n++) {
                grid[n][0][spreadProp] = this.oldGrid[n][0];
                grid[n][1][spreadProp] = this.oldGrid[n][1];
                grid[n][grid.length-1][spreadProp] = this.oldGrid[n][grid.length-1];
                grid[n][grid.length-2][spreadProp] = this.oldGrid[n][grid.length-2];
                grid[0][n][spreadProp] = this.oldGrid[0][n];
                grid[1][n][spreadProp] = this.oldGrid[1][n];
                grid[grid.length-1][n][spreadProp] = this.oldGrid[grid.length-1][n];
                grid[grid.length-2][n][spreadProp] = this.oldGrid[grid.length-2][n];
            }
        }
    }

    propagate(grid, i, j, spreadProp, frictionProp) {
        //add the directional neighbour * vector proportion - friction property affect from oldGrid value
        let xn = this.windVector.x > 0 ? -1 : 1;
        let yn = this.windVector.y > 0 ? -1 : 1;

        //escape overadding to near-edge cells
        //if(i+xn == 0 | i+xn == grid.length-1 || j+yn == 0 || j + yn == grid.length-1) return;

        //calc a friction value from 0 to 1 for the amount the value is above the sea.
        let friction = (100 - grid[i][j][frictionProp]) / (100 - this.seaLevel);

        //get spread from horizontal component, 
        let horizontalSpread = Math.floor(this.oldGrid[i + xn][j] * Math.abs(this.windVector.x) * friction * 0.35);

        //and same for vertical component
        let verticalSpread = Math.floor(this.oldGrid[i][j + yn] * Math.abs(this.windVector.y) * friction * 0.35);

        //and reducing them from the prev tile and adding it to the next
        grid[i][j][spreadProp] += horizontalSpread;
        grid[i + xn][j][spreadProp] -= horizontalSpread;
        grid[i][j][spreadProp] += verticalSpread;
        grid[i][j + yn][spreadProp] -= verticalSpread;

    }
}