class packageManager{
    installedPackages = new Set()
    implicitPackages = new Set()
    explicitPackages = new Set()
    dependencyMap = new Map()
    reliesOnMap = new Map()

    depend(pkg, ...args){
        console.log(`DEPEND ${pkg}`, ...args)

        // constructs dependency map 
        for(let i = 0; i < args.length; i++){
            if (this.dependencyMap.has(pkg)){
                const packageDependencies = this.dependencyMap.get(pkg)
                packageDependencies.add(args[i])
            }else{
                const set = new Set()
                set.add(args[i])
                this.dependencyMap.set(pkg, set)
            }
        }

        // constructs relies on map 
        for(let i = 0; i < args.length; i++){
            if(this.reliesOnMap.has(args[i])){
                const reliesOnPackages = this.reliesOnMap.get(args[i])
                reliesOnPackages.add(pkg)
            }else{
                const set = new Set()
                set.add(pkg)
                this.reliesOnMap.set(args[i], set)
            }
        }
    }

    install(pkg){
        console.log(`INSTALL ${pkg}`)

        if(this.installedPackages.has(pkg)){
            console.log(`    ${pkg} is already installed`)
        }

        // dfs, when we hit the end ... install ... bubble up and install as we go through the search 
        function dfsInstall(dep, dependencyMap, implicitPackages, innstalledPkg){

            let depsList = null
            if(dependencyMap.has(dep)){
                depsList = dependencyMap.get(dep)
            }

            if(depsList === null){
                if(!innstalledPkg.has(dep)){
                    console.log(`    Installing ${dep}`)
                    implicitPackages.add(dep)
                    innstalledPkg.add(dep)
                }
                return
            }

            depsList.forEach((element) => {
                if(innstalledPkg.has(element) == false){
                    dfsInstall(element, dependencyMap, implicitPackages, innstalledPkg)
                }
            })

            if(!innstalledPkg.has(dep)){
                console.log(`    Installing ${dep}`)
                implicitPackages.add(dep)
                innstalledPkg.add(dep)
            }

            return 
        }

        dfsInstall(pkg, this.dependencyMap, this.implicitPackages, this.installedPackages)

        // the dfsInstall function will mark this as installed implicitly ... remove it from the implicitly installed list 
        this.implicitPackages.delete(pkg)

        // mark this package as being explicitly installed 
        this.explicitPackages.add(pkg)
    }

    remove(pkg){
        console.log(`REMOVE ${pkg}`)
        
        // if the package is not installed, we have nothing to remove
        if(this.installedPackages.has(pkg) == false){
            console.log(`    ${pkg} is not installed`)
            return
        }

        // if the current package is a requirment to another package ... do not remove it 
        const reliesOnSet = this.reliesOnMap.get(pkg)

        if(reliesOnSet != null){
            // check if any of the neighbors that rely on this package are installed, if yes, the package is still needed
            reliesOnSet.forEach((element) => {
                if(this.installedPackages.has(element)){
                    console.log(`    ${pkg} is still needed`)
                    return 
                }
            })
        }

        // remove package we want to remove from the explicitPackages list, because the user explicitly declared it safe to be removed
        this.explicitPackages.delete(pkg)
        const stagingRemoveSet = new Set();

        function dfsRemove(currentPkg, lastVisitedPkg, dependencyMap, reliesOnMap, explicitPackages, innstalledPkgs){
            // if the currently installed package was explicitly installed, return, this package can not be removed 
            if(explicitPackages.has(currentPkg) === true){
                return 
            }

            const dependencySet = dependencyMap.has(currentPkg)? dependencyMap.get(currentPkg) : null
            const reliesOnArray = reliesOnMap.has(currentPkg)? Array.from(reliesOnMap.get(currentPkg)) : []
            let safeToRemoveFlag = true;

            // get the list of neighbors that rely in this package 
            for(let i = 0; i < reliesOnArray.length; i++){    

                // if we are looking at the neighbor that we just came from
                // check if the neighbor IS NOT in the staging to remove set, if not in the set, the current package can not be removed!
                if(reliesOnArray[i] === lastVisitedPkg){
                    if(!stagingRemoveSet.has(reliesOnArray[i])){
                        safeToRemoveFlag = false;
                    }
                    continue
                }

                // check if the neighbor is installed 
                // if the neighbor has not been visited (the neighbor is not in the staging Remove Set)
                // then the current package we are trying to remove, IS STILL NEEDED (do not remove it)
                if(innstalledPkgs.has(reliesOnArray[i])){
                    if(stagingRemoveSet.has(reliesOnArray[i]) === false){
                        safeToRemoveFlag = false;
                        break;
                    }
                }
            }

            // the current package has no neighbors that depend on it, the current package is safe to remove, add it to the staging set
            if(safeToRemoveFlag === true){
                stagingRemoveSet.add(currentPkg)
            }

            // if their are no more dependencies on this package, it is a leaf node, return 
            if(dependencySet === null){
                return 
            }

            dependencySet.forEach((element) => {
                dfsRemove(element, currentPkg, dependencyMap, reliesOnMap, explicitPackages, innstalledPkgs)
            })
            return 
        }

        dfsRemove(pkg, "", this.dependencyMap, this.reliesOnMap, this.explicitPackages, this.installedPackages)
        stagingRemoveSet.forEach((element) => {
            this.installedPackages.delete(element)
            console.log(`    Removing ${element}`)
        })
    }

    list(){
        // list all packages in the installed set 
        console.log("LIST")
        Array.from(this.installedPackages.values()).forEach(element => {
            console.log(`    ${element}`)
        });
    }

    printMaps(){
        console.log("------- DEBUG dependencyMap: -------")
        printMapSet(this.dependencyMap)
        console.log("-------- DEBUG reliesOnMap: --------")
        printMapSet(this.reliesOnMap)
    }
}

function printMapSet(map){
    map.forEach((valueSet, key) => {
        console.log(`${key} ${Array.from(valueSet.values())}`)
    })
}

const pm = new packageManager()
pm.depend("TCPIP", "NETCARD")
pm.depend("TELNET", "TCPIP", "SOCKET")
pm.depend("DNS", "TCPIP")
pm.depend("HTML", "REGEX", "XML")
pm.depend("REGEX", "PARSING")
pm.depend("BROWSER", "DNS", "TCPIP", "HTML", "CSS")
pm.printMaps()
console.log("------------ TEST CASES ------------")

pm.install("TCPIP")
pm.remove("NETCARD")
pm.remove("TCPIP")
pm.remove("NETCARD")
pm.install("TCPIP")
pm.list()
pm.install("TCPIP")
pm.install("foo")
pm.remove("TCPIP")
pm.install("NETCARD")
pm.install("TCPIP")
pm.remove("TCPIP")
pm.list()
pm.install("TCPIP")
pm.install("NETCARD")
pm.remove("TCPIP")
pm.list()
pm.remove("NETCARD")
pm.install("BROWSER")
pm.list()
pm.remove("BROWSER")
pm.list()
pm.install("HTML")
pm.install("TELNET")
pm.remove("SOCKET")
pm.install("DNS")
pm.install("BROWSER")
pm.remove("NETCARD")
pm.list()
pm.remove("BROWSER")
pm.list()
