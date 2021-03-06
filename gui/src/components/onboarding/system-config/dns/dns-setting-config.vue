/*
* CORTX-CSM: CORTX Management web and CLI interface.
* Copyright (c) 2020 Seagate Technology LLC and/or its Affiliates
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published
* by the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
* For any questions about this software or licensing,
* please email opensource@seagate.com or cortx-questions@seagate.com.
*/
<template>
  <v-container class="mt-0 ml-0">
    <div class="pl-4 body-2">
      <div class="row ma-0">
        <div class="col-2 body-2 column node-container">
          <div class="mt-5 font-weight-bold">
            <div class="mt-6 dns-label">
              <label id="dns-serverlbl">DNS servers*:</label>
            </div>
            <div class>
              <label id="dns-domainslbl">Search domains*:</label>
            </div>
          </div>
        </div>
        <template v-for="node in $v.dnsNodes.$each.$iter">
          <div
            class="col-4 body-2 column node-container mr-5"
            v-if="node.$model.id === 0"
            :key="node.id"
          >
            <div class="mt-0 ml-0">
              <div
                class="cortx-form-group cortx-form-group-custom mt-3"
                :class="{
                  'cortx-form-group--error': node.dns_servers.$error
                }"
              >
                <textarea
                  v-on:change="setDNSServers(node.$model.id)"
                  class="cortx-form__input_textarea cortx-form__input_textarea-custom"
                  rows="3"
                  placeholder="Use a comma (,) to separate multiple DNS server values. Example, 1.1.1.1, example.com."
                  v-model.trim="node.dns_servers.$model"
                  @input="node.dns_servers.$touch"
                  :id="node.$model.id + 'txtDnsServer'"
                  :name="node.$model.id + 'dnsname'"
                ></textarea>
                <div class="cortx-form-group-label cortx-form-group-error-msg">
                  <label id="dns-addess-reuired"
                    v-if="node.dns_servers.$dirty && !node.dns_servers.required"
                    >DNS address is required.</label
                  >
                </div>
              </div>
              <div
                class="cortx-form-group cortx-form-group-custom mt-3"
                :class="{
                  'cortx-form-group--error': node.search_domain.$error
                }"
              >
                <textarea
                  v-on:change="setSearchDomain(node.$model.id)"
                  class="cortx-form__input_textarea cortx-form__input_textarea-custom"
                  :id="node.$model.id + 'txtSearchDomain'"
                  :name="node.$model.id + 'search-domain'"
                  v-model.trim="node.search_domain.$model"
                  rows="3"
                  placeholder="Use a comma (,) to separate multiple Search domain values. Example, 1.1.1.1, example.com."
                  @input="node.search_domain.$touch"
                ></textarea>
                <div class="cortx-form-group-label cortx-form-group-error-msg">
                  <label id="dns-searchdomain-reuired"
                    v-if="
                      node.search_domain.$dirty && !node.search_domain.required
                    "
                    >Search domain is required.</label
                  >
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <span class="d-none">{{ isValidForm }}{{ managementNetworkGetter }}</span>
    <button
      id="dns-applybtn"
      type="button"
      v-if="$route.path !== '/onboarding'"
      :disabled="$v.$invalid"
      @click="applySettings()"
      class="cortx-btn-primary cortx-float-l my-10"
    >
      Apply
    </button>
  </v-container>
</template>
<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import {
  SystemConfigObject,
  DnsNetworkSettings
} from "./../../../../models/system-configuration";
import { EVENT_BUS } from "./../../../../main";
import { Validations } from "vuelidate-property-decorators";
import {
  required,
  helpers,
  sameAs,
  ipAddress,
  requiredIf
} from "vuelidate/lib/validators";
@Component({
  name: "cortx-dns-setting-config"
})
export default class CortxDnsSettingConfig extends Vue {
  @Validations()
  private validations = {
    dnsNodes: {
      $each: {
        dns_servers: {
          required
        },
        search_domain: {
          required
        }
      }
    }
  };

  private data() {
    return {
      source: "manual",
      dnsNodes: [
        {
          id: 0,
          name: "Node 0",
          dns_servers: null,
          search_domain: null
        }
      ],
      isValid: true
    };
  }

  private setDNSServers(nodeId: number) {
    const dnsServers = this.$v.dnsNodes.$model[nodeId].dns_servers;
    this.$v.dnsNodes.$model[nodeId].dns_servers = dnsServers.replace(
      /\s+/g,
      ""
    );
  }
  private setSearchDomain(nodeId: number) {
    const searchDomains = this.$v.dnsNodes.$model[nodeId].search_domain;
    this.$v.dnsNodes.$model[nodeId].search_domain = searchDomains.replace(
      /\s+/g,
      ""
    );
  }

  private splitByComma(str: string) {
    return str.split(",").filter(Boolean);
  }
  private updateDNSconfig() {
    // Return only node 0 configurations by filtering node by ID 0
    const nodes = this.$data.dnsNodes
      .map((e: any) => {
        e.dns_servers = this.splitByComma(`${e.dns_servers}`);
        e.search_domain = this.splitByComma(`${e.search_domain}`);
        return e;
      })
      .filter((e: any) => e.id === 0);
    const queryParams: DnsNetworkSettings = {
      nodes
    };
    return this.$store.dispatch("systemConfig/updateDNSSetting", queryParams);
  }
  private mounted() {
    // WizardHook: Open a listener for onNext event
    // So when wizard footer clicks on the Next Button this component can perform its own workflow
    EVENT_BUS.$on("emitOnNext", (res: any) => {
      this.updateDNSconfig().then(result => {
        res(true);
      });
    });
  }
  private destroyed() {
    // WizardHook: shut off on exit event listner
    EVENT_BUS.$off("emitOnNext");
  }
  get isValidForm() {
    const validate = true;
    // WizardHook: Emit event to sibling wizard footer component
    // to send information about data validation to enable/disable wizard footer
    EVENT_BUS.$emit("validForm", !this.$v.$invalid);
    return validate;
  }
  get managementNetworkGetter(): any {
    const systemconfig = this.$store.getters["systemConfig/systemconfig"];
    if (
      systemconfig.dns_network_settings &&
      systemconfig.dns_network_settings.nodes &&
      systemconfig.dns_network_settings.nodes[0]
    ) {
      this.$data.dnsNodes = systemconfig.dns_network_settings.nodes;
    }
    return true;
  }
  private applySettings() {
    // Return only node 0 configurations by filtering node by ID 0
    const nodes = this.$data.dnsNodes
      .map((e: any) => {
        e.dns_servers = this.splitByComma(`${e.dns_servers}`);
        e.search_domain = this.splitByComma(`${e.search_domain}`);
        return e;
      })
      .filter((e: any) => e.id === 0);

    const queryParams: DnsNetworkSettings = {
      nodes
    };
    this.$emit("apply-settings", queryParams);
  }
}
</script>
<style lang="scss" scoped>
.node-container {
  max-width: 30em;
}
.dns-label {
  height: 95px;
}
</style>
