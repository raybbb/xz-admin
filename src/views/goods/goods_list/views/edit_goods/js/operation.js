import convertHttp from '@/utils/convertHttp'
export default {
	created() {
		this.getDetail()
		this.getGoodsTypeList()
		this.getSkuList()
	},
	methods: {
		handleClose(tag, key) {
			let index = this[key].indexOf(tag)
			if (key === 'selectSkuLabel') {
				this.selectSkuList.splice(index, 1)
				this.bindingSelectSkuList = this.bindingSelectSkuList.filter(val => val[0] !== tag)
			}
			this[key].splice(index, 1);
		},
		showInput(key_1, key_2) {
			this[key_1] = true;
			this.$nextTick(_ => {
				this.$refs[key_2].$refs.input.focus();
			});
		},
		handleInputConfirm(key_1, key_2, key_3) {
			let inputValue = this[key_1];
			if (key_3 === 'selectSkuLabel' && inputValue && !this[key_3].includes(inputValue)) {
				this.selectSkuList.push({
					label: inputValue,
					inputValue: '',
					inputVisible: false,
					children: []
				})
			}
			if (inputValue && !this[key_3].includes(inputValue)) {
				this[key_3].push(inputValue);
			} else {
				this.$warnMsg("不允许重复")
			}
			this[key_2] = false;
			this[key_1] = '';
		},
		showInputChildren(index) {
			this.selectSkuList[index].inputVisible = true;
		},
		handleCloseChildren(tag, index) {
			this.selectSkuList[index].children.splice(
				this.selectSkuList[index].children.indexOf(tag),
				1
			)
		},
		handleInputConfirmChildren(index) {
			let inputValue = this.selectSkuList[index].inputValue;
			if (inputValue && !this.selectSkuList[index].children.includes(inputValue)) {
				this.selectSkuList[index].children.push(inputValue);
			} else {
				this.$warnMsg("不允许重复")
			}
			this.selectSkuList[index].inputVisible = false;
			this.selectSkuList[index].inputValue = '';
		},
		handleRemove(file, fileList) {
			let index = fileList.findIndex(fileItem => {
				return fileItem.uid === file.uid
			})
			this.sliderImage.splice(index, 1)
			this.$http_json({
				url: "/api/localStorage/del",
				method: "post",
				data: [this.fileList[index].id]
			}).then(result => {
				this.fileList.splice(index, 1)
			})
		},
		generatorSkuList() {
			this.generateSkuList.splice(0)
			this.selectSkuList.forEach(val => {
				this.generateSkuList.push({
					name: val.label,
					category: val.children.map(val => {
						return {
							name: val,
							costPrice: 0,
							image: "",
							sales: 0,
							salesPrice: 0,
							stock: 0,
							value: val,
							checked: false,
							coverImage: ''
						}
					})
				})
			})
			try {
				this.generateSkuList = this.generateSkuList.reduce((ary, {
					name,
					category
				}) => {
					return ary.length ? [].concat(...category.map(v => ary.map(
							res => ({
								skuDesc: { ...res.skuDesc,
									[name]: v.name
								},
								...v
							})))) :
						category.map(
							v => ({
								skuDesc: {
									[name]: v.name
								},
								...v
							}));
				}, []);
				this.caculateSalesPrice()
				this.ensureSkuList = JSON.parse(JSON.stringify(this.selectSkuList))
			} catch (e) {
				this.$warnMsg("规格值不能为空")
			}
			this.$http_json({
				url: "/api/productSpec/save",
				method: "post",
				data: this.selectSkuList.map((val, ind) => {
					for (let i = 0, len = this.skuList.length; i < len; i++) {
						if (val.label === this.skuList[i].label) {
							return {
								id: this.skuList[i].id,
								name: val.label,
								value: JSON.stringify(val.children)
							}
						}
					}
					return {
						name: val.label,
						value: JSON.stringify(val.children)
					}
				})
			}).then(result => {
				this.getSkuList()
			})
		},
		selectAllSku(e) {
			if (e) {
				this.generateSkuList.forEach(val => {
					val.checked = true
				})
			} else {
				this.generateSkuList.forEach(val => {
					val.checked = false
				})
			}
		},
		deleteSku(index) {
			this.generateSkuList.splice(index, 1)
		},
		deleteAllSku() {
			for (let i = this.generateSkuList.length - 1; i >= 0; i--) {
				if (this.generateSkuList[i].checked) {
					this.generateSkuList.splice(i, 1)
				}
			}
		},
		showEditBox() {
			this.$refs.editForm.dialog = true
		},
		caculateSalesPrice() {
			let lowest = Infinity
			this.salesPriceList.splice(0)
			this.generateSkuList.forEach(val => {
				if (val.salesPrice < lowest) {
					lowest = val.salesPrice
				}
			})
			this.salesPriceList = this.$removeRepeat(this.generateSkuList, 'salesPrice')
			this.form.spu.salesPrice = lowest
		},
		// 上传封面
		uploadImage_1(param) {
			this.$http_file({
				url: "/api/localStorage/upload",
				method: "post",
				data: {
					file: param.file
				},
				timeout: 100000
			}).then(result => {
				this.coverImage = convertHttp(result.data.url)
				this.form.spu.cover = result.data.url
				this.$successMsg("上传成功！");
			});
		},
		uploadImage_2(param) {
			this.$http_file({
				url: "/api/localStorage/upload",
				method: "post",
				data: {
					file: param.file
				},
				timeout: 100000
			}).then(result => {
				const data = result.data
				this.sliderImage.push({
					id: data.id,
					url: data.url
				})
				this.fileList.push({
					id: data.id,
					url: convertHttp(data.url)
				})
				this.$successMsg("上传成功！");
			});
		},
		setIndex(index) {
			this.inputChildrenIndex = index
		},
		uploadImage_3(param) {
			this.$http_file({
				url: "/api/localStorage/upload",
				method: "post",
				data: {
					file: param.file
				},
				timeout: 100000
			}).then(result => {
				const data = result.data
				this.generateSkuList[this.inputChildrenIndex].image = data.url
				this.generateSkuList[this.inputChildrenIndex].coverImage = convertHttp(data.url)
				this.$successMsg("上传成功！");
			});
		},
		querySearchAsync(val, cb) {
			this.$http_normal({
				url: `/api/productBrand/page?page=9}&size=9999&sort=sort,asc`,
				method: "get"
			}).then(result => {
				cb(result.data.content)
			});
		},
		initialGoodsTypeList(list) {
			this.goodsTypeList.splice(0)
			list.forEach(val => {
				this.goodsTypeList.push(val)
			})
		},
		handleGoodsTypeList(list) {
			let newList = []
			list.forEach(val => {
				newList.push({
					label: val.name,
					value: val.id,
					children: val.children ?
						this.handleGoodsTypeList(val.children) : null
				})
			})
			return newList
		},
		getGoodsTypeList() {
			this.$http_json({
				url: `/api/shop/productType/queryAll?sort=sort,asc`,
				method: "get"
			}).then(result => {
				this.initialGoodsTypeList(this.handleGoodsTypeList(result.data.content));
			});
		},
		initialSkuList(list) {
			this.skuList.splice(0);
			list.forEach(value => {
				this.skuList.push(value);
			});
		},
		handleSkuList(list) {
			let newList = []
			list.forEach(val => {
				newList.push({
					id: val.id,
					label: val.name,
					value: val.name,
					children: val.value ?
						JSON.parse(val.value).map(val => {
							return {
								label: val,
								value: val
							}
						}) : null
				})
			})
			return newList
		},
		getSkuList() {
			this.$http_normal({
				url: `/api/productSpec/page?page=0&size=9999&sort=id,desc`,
				method: "get"
			}).then(result => {
				this.initialSkuList(this.handleSkuList(result.data.content))
			});
		},
		selectBrand(item) {
			this.form.spu.brandName = item.name
			this.form.spu.brandId = item.id
		},
		selectGoodsType(item) {
			this.typeId = []
			this.form.spu.typeId.splice(0)
			this.typeName.splice(0)
			item.forEach(val => {
				this.typeId.push(...val)
				this.form.spu.typeId.push(...val)
			})
			this.$refs.goodsType.getCheckedNodes().forEach(val => {
				this.typeName.push(val.label)
			})
		},
		merge(val) {
			let arr = [],
				key = "",
				ind = 0
			val.forEach(val => {
				if (key === val[0]) {
					ind--
					arr[ind].push(val[1])
				} else {
					key = val[0]
					arr[ind] = [val[0], val[1]]
				}
				ind++
			})
			return arr
		},
		selectSkuType(item) {
			const res = new Map();
			const arr = []
			this.skuList.forEach(val => {
				arr.push(val.label)
				if (val.children) {
					arr.push(...val.children.map(val => val.label))
				}
			})
			this.selectSkuLabel = this.selectSkuLabel.filter(val => {
				return arr.indexOf(val) === -1
			})
			this.selectSkuList = this.selectSkuList.filter(val => {
				return arr.indexOf(val.label) === -1
			})
			this.merge(item).forEach(val => {
				this.selectSkuList.push({
					label: val[0],
					inputVisible: false,
					inputValue: '',
					children: val.filter((val, ind) => ind !== 0) || []
				})
			})
			this.selectSkuLabel.push(...this.selectSkuList.map(val => val.label))
			this.selectSkuLabel = this.selectSkuLabel.filter(val => !res.has(val) && res.set(val, 1))
		},
		submitForm() {
			this.$refs.form.validate(valid => {
				if (valid) {
					if (this.generateSkuList.length && this.skuGroup === 'more') {
						this.form.spu.specs = JSON.stringify(this.ensureSkuList.map(val => {
							return {
								name: val.label,
								value: val.children
							}
						}))
						this.form.skus = this.generateSkuList.map(val => {
							return {
								costPrice: val.salesPrice,
								image: val.image,
								sales: 0,
								salesPrice: 0,
								stock: val.stock,
								value: JSON.stringify(val.skuDesc)
							}
						})
					} else {
						this.form.skus.push({
							costPrice: this.form.spu.salesPrice,
							image: this.form.spu.cover,
							sales: 0,
							salesPrice: 0,
							stock: this.form.spu.totalStock,
							value: JSON.stringify({
								'默认': '推荐'
							})
						})
						this.form.spu.specs = JSON.stringify([{
							name: '默认',
							value: ['推荐']
						}])
					}
					this.form.spu.keyWords = `,${this.dynamicTags.join(",")},`
					this.form.spu.typeName = JSON.stringify({
						typeName: this.typeName,
						typeObj: this.typeObj
					})
					this.form.spu.typeId = `,${this.typeId.join(",")},`
					this.form.spu.sliderImage = JSON.stringify(this.sliderImage)
					this.$http_json({
						url: "/api/productSpu/edit",
						method: "post",
						data: this.form
					}).then(result => {
						this.$successMsg("编辑成功");
						this.$router.push({
							path: "/home/goods_list"
						})
					});
				} else {
					return false;
				}
			});
		},
		initialDetail(data) {
			let
				spu = data.spu,
				skus = data.skus
			Object
				.keys(spu)
				.forEach(val => {
					if (val !== 'editor' ||
						val !== 'editTime' ||
						val !== 'deletion' ||
						val !== 'creator' ||
						val !== 'createTime') {
						this.form.spu[val] = spu[val]
					}
					if (val === 'cover') {
						this.coverImage = spu[val] ?
							convertHttp(spu[val]) :
							''
					} else if (val === 'typeName') {
						this.typeName = JSON.parse(spu[val]).typeName
						this.typeObj = JSON.parse(spu[val]).typeObj
						this.form.spu[val] = spu[val]
					} else if (val === 'typeId') {
						this.typeId = spu[val].replace(/^,/, '').replace(/,$/, '').split(",")
						this.form.spu[val] = spu[val]
					} else if (val === 'brandName') {
						this.brandName = spu[val]
					} else if (val === 'keyWords') {
						this.dynamicTags = spu[val].replace(/^,/, '').replace(/,$/, '').length ?
							spu[val].replace(/^,/, '').replace(/,$/, '').split(",") :
							[]
					} else if (val === 'specs') {
						const specs = JSON.parse(spu[val])
						if(specs[0].name !== '默认') {
							specs.forEach(val => {
								this.ensureSkuList.push({
									label: val.name,
									children: val.value
								})
							})
						}
					} else if (val === 'sliderImage') {
						const list = JSON.parse(spu[val])
						list.forEach(val => {
							this.fileList.push({
								id: val.id,
								url: convertHttp(val.url)
							})
							this.sliderImage.push({
								id: val.id,
								url: val.url
							})
						})
					}
				})
			if (new RegExp(/默认/g).test(skus[0].value)) {
				this.skuGroup = 'default'
			} else {
				this.skuGroup = 'more'
				this.generateSkuList = skus.map(val => {
					return {
						skuDesc: JSON.parse(val.value),
						coverImage: val.image
						? convertHttp(val.image)
						: '',
						checked: false,
						...val,
					}
				})
			}
		},
		getDetail() {
			this.$http_json({
				url: `/api/productSpu/get/${this.$route.query.id}`,
				method: "get"
			}).then(result => {
				this.initialDetail(result.data)
			})
		},
		// 重置表单
		resetForm() {
			try {
				this.brandName = ""
				this.form = {
					skus: [],
					spu: {
						attributes: "",
						barCode: "",
						brandId: "",
						brandName: "",
						codePath: "",
						costPrice: 0,
						description: "",
						fictiSales: 0,
						giveIntegral: 0,
						info: "",
						keyWords: "",
						marketPrice: 0,
						merId: 0,
						merUse: 0,
						name: "",
						onBargain: 0,
						onBenefit: true,
						onBest: true,
						onFreeSend: true,
						onHot: true,
						onNew: true,
						onRecommend: true,
						onSeckill: true,
						postagePrice: 0,
						sales: 0,
						salesPrice: 0,
						showStatus: 0,
						sort: 0,
						soureLink: "",
						specs: "",
						stockReduceType: 0,
						totalStock: 0,
						typeId: [],
						typeName: [],
						unit: "",
						vipPrice: 0,
						visit: 0,
						warnStock: 0
					}
				}
				this.$refs.form.resetFields();
			} catch (e) {}
		},
		handlePictureCardPreview(file) {
			this.dialogImageUrl = file.url;
			this.dialogVisible = true;
		},
		format(key) {
			if (!this.form.spu[key]) {
				return
			}
			if (this.form.spu[key] <= 0) {
				this.form.spu[key] = 0
			}
		},
		formatChildren(key, index) {
			if (!this.generateSkuList[index][key]) {
				return
			}
			if (this.generateSkuList[index][key] <= 0) {
				this.generateSkuList[index][key] = 0
			}
			if (key === 'salesPrice') {
				this.caculateSalesPrice()
			}
		},
		getPostagePrice() {
			if (!this.form.spu.postagePrice) {
				return
			}
			if (this.form.spu.postagePrice > 0) {
				this.form.spu.onFreeSend = false
			} else {
				this.form.spu.onFreeSend = true
				this.form.spu.postagePrice = 0
			}
		}
	}
}